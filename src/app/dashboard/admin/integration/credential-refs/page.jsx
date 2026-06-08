'use client';

import { z as zod } from 'zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import { LoadingButton } from '@mui/lab';
import { DataGrid } from '@mui/x-data-grid';
import { Icon } from '@iconify/react';

import { Form, Field } from 'src/components/hook-form';
import { useIntegrationToast } from 'src/components/integration-toast/integration-toast-provider';
import { useAuthContext } from 'src/auth/hooks';
import { isCentralAdmin } from 'src/lib/admin-access';
import {
  createCredentialRef,
  credentialRefTypeLabel,
  deleteCredentialRef,
  listCredentialRefs,
  updateCredentialRef,
} from 'src/lib/integration-api';

const FormSchema = zod.object({
  ref: zod.string().min(1, 'ref الزامی است'),
  env_prefix: zod.string().min(1, 'env_prefix الزامی است'),
  vault_path: zod.string().optional(),
  description: zod.string().optional(),
});

const defaultFormValues = {
  ref: '',
  env_prefix: '',
  vault_path: '',
  description: '',
};

function mapRow(item) {
  return {
    id: item.id,
    ref: item.ref,
    type: item.type,
    type_label: credentialRefTypeLabel(item.type),
    env_prefix: item.env_prefix,
    vault_path: item.vault_path,
    description: item.description || '—',
    raw: item,
    created_at: item.created_at ? new Date(item.created_at).toLocaleString('fa-IR') : '—',
  };
}

export default function CredentialRefsPage() {
  const { user } = useAuthContext();
  const allowed = isCentralAdmin(user);
  const toast = useIntegrationToast();

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [editor, setEditor] = useState({ open: false, mode: 'create', row: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });

  const methods = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: defaultFormValues,
  });

  const { handleSubmit, reset, formState } = methods;

  const fetchData = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const { items, total } = await listCredentialRefs({
        offset: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
      });
      setRows(items.map(mapRow));
      setRowCount(total > 0 ? total : items.length);
    } catch (error) {
      console.error('Failed to fetch credential refs:', error);
      setErrorMessage(error?.message || 'خطا در دریافت ارجاعات اعتبار');
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [allowed, paginationModel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    reset(defaultFormValues);
    setEditor({ open: true, mode: 'create', row: null });
  };

  const openEdit = (row) => {
    reset({
      ref: row.ref || '',
      env_prefix: row.env_prefix || '',
      vault_path: row.vault_path || '',
      description: row.description === '—' ? '' : row.description || '',
    });
    setEditor({ open: true, mode: 'edit', row });
  };

  const closeEditor = () => {
    setEditor({ open: false, mode: 'create', row: null });
    reset(defaultFormValues);
  };

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);
    try {
      const body = {
        ref: values.ref.trim(),
        env_prefix: values.env_prefix.trim(),
        vault_path: values.vault_path?.trim() ?? '',
        description: values.description?.trim() ?? '',
      };

      if (editor.mode === 'create') {
        await createCredentialRef(body);
        toast.success('ارجاع اعتبار ایجاد شد');
      } else {
        await updateCredentialRef(editor.row.id, body);
        toast.success('ارجاع اعتبار به‌روزرسانی شد');
      }

      closeEditor();
      fetchData();
    } catch (error) {
      setErrorMessage(error?.message || 'ذخیره ناموفق بود');
    }
  });

  const confirmDelete = async () => {
    if (!deleteDialog.row) return;
    try {
      await deleteCredentialRef(deleteDialog.row.id);
      toast.success('ارجاع اعتبار حذف شد');
      setDeleteDialog({ open: false, row: null });
      fetchData();
    } catch (error) {
      setErrorMessage(error?.message || 'حذف ناموفق بود');
    }
  };

  const columns = useMemo(
    () => [
      {
        field: 'ref',
        headerName: 'Ref',
        flex: 1.2,
        minWidth: 200,
        renderCell: ({ value }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', direction: 'ltr' }}>
            {value}
          </Typography>
        ),
      },
      {
        field: 'type_label',
        headerName: 'نوع',
        width: 100,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            label={row.type_label}
            color={row.type === 'vault' ? 'secondary' : 'default'}
            variant="soft"
          />
        ),
      },
      {
        field: 'env_prefix',
        headerName: 'Env Prefix',
        width: 130,
        renderCell: ({ value }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', direction: 'ltr' }}>
            {value}
          </Typography>
        ),
      },
      {
        field: 'description',
        headerName: 'توضیحات',
        flex: 1,
        minWidth: 180,
      },
      {
        field: 'actions',
        headerName: 'عملیات',
        width: 110,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="ویرایش">
              <IconButton size="small" onClick={() => openEdit(row)}>
                <Icon icon="solar:pen-linear" width={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="حذف">
              <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, row })}>
                <Icon icon="solar:trash-bin-trash-linear" width={18} />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    []
  );

  if (!allowed) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        فقط مدیر مرکزی به این بخش دسترسی دارد.
      </Alert>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5">ارجاعات اعتبار (Credential Refs)</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            فقط متادیتا — مقادیر secret هرگز در API ذخیره یا نمایش داده نمی‌شوند.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Icon icon="mingcute:add-line" />} onClick={openCreate}>
          ارجاع جدید
        </Button>
      </Stack>

      {errorMessage ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      ) : null}

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            rowCount={rowCount}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sx={{ border: 0 }}
          />
        </CardContent>
      </Card>

      <Dialog open={editor.open} onClose={closeEditor} fullWidth maxWidth="sm">
        <DialogTitle>{editor.mode === 'create' ? 'ارجاع اعتبار جدید' : 'ویرایش ارجاع اعتبار'}</DialogTitle>
        <Form methods={methods} onSubmit={onSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Field.Text
                name="ref"
                label="Ref"
                placeholder="cred://prod/foo"
                slotProps={{ input: { sx: { fontFamily: 'monospace', direction: 'ltr' } } }}
              />
              <Field.Text
                name="env_prefix"
                label="Env Prefix"
                placeholder="FOO_"
                helperText="پیشوند متغیرهای محیطی (مثلاً FOO_API_KEY)"
                slotProps={{ input: { sx: { fontFamily: 'monospace', direction: 'ltr' } } }}
              />
              <Field.Text
                name="vault_path"
                label="Vault Path (اختیاری)"
                placeholder="secret/data/foo"
                helperText="در صورت خالی بودن، resolver از env استفاده می‌کند"
                slotProps={{ input: { sx: { fontFamily: 'monospace', direction: 'ltr' } } }}
              />
              <Field.Text name="description" label="توضیحات" multiline minRows={2} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditor}>انصراف</Button>
            <LoadingButton type="submit" variant="contained" loading={formState.isSubmitting}>
              ذخیره
            </LoadingButton>
          </DialogActions>
        </Form>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, row: null })}>
        <DialogTitle>حذف ارجاع اعتبار</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ارجاع «{deleteDialog.row?.ref}» حذف می‌شود. کانکتورهایی که از این ref استفاده می‌کنند ممکن است
            دچار خطا شوند.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, row: null })}>انصراف</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
