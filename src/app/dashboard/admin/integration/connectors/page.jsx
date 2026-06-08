'use client';

import { z as zod } from 'zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  MenuItem,
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
import { paths } from 'src/routes/paths';
import { isCentralAdmin } from 'src/lib/admin-access';
import {
  attachActionCounts,
  CONNECTOR_TYPES,
  connectorTypeLabel,
  createConnector,
  deleteConnector,
  formatConfigJson,
  listConnectors,
  listCredentialRefs,
  parseConfigJsonInput,
  testConnector,
  updateConnector,
} from 'src/lib/integration-api';

import { CONNECTOR_PRESETS } from '../_lib/connector-presets';

const ConnectorSchema = zod.object({
  name: zod.string().min(1, 'نام الزامی است'),
  type: zod.string().min(1, 'نوع الزامی است'),
  credential_ref: zod.string().optional(),
  config_json: zod.string().min(1, 'پیکربندی JSON الزامی است'),
});

const defaultFormValues = {
  name: '',
  type: 'rest',
  credential_ref: '',
  config_json: '{}',
};

function mapConnectorRow(item) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    type_label: connectorTypeLabel(item.type),
    is_active: item.is_active,
    actions_count: item.actions_count ?? 0,
    credential_ref: item.credential_ref,
    config_json: item.config_json,
  };
}

export default function ConnectorsCatalogPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const allowed = isCentralAdmin(user);
  const toast = useIntegrationToast();

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState(null);

  const [editor, setEditor] = useState({ open: false, mode: 'create', row: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [testDialog, setTestDialog] = useState({ open: false, row: null, loading: false, result: null });
  const [editorTestLoading, setEditorTestLoading] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState(null);
  const [credentialRefOptions, setCredentialRefOptions] = useState([]);

  const methods = useForm({
    resolver: zodResolver(ConnectorSchema),
    defaultValues: defaultFormValues,
  });

  const { handleSubmit, reset, formState } = methods;

  const fetchData = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const isActive =
        statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : null;
      const { items, total } = await listConnectors({
        offset: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
        isActive,
      });
      const enriched = await attachActionCounts(items);
      setRows(enriched.map(mapConnectorRow));
      setRowCount(total > 0 ? total : enriched.length);
    } catch (error) {
      console.error('Failed to fetch connectors:', error);
      setErrorMessage(error?.message || 'خطا در دریافت کانکتورها');
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [allowed, paginationModel, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!allowed) return;
    listCredentialRefs({ limit: 200, offset: 0 })
      .then(({ items }) => setCredentialRefOptions(items.map((item) => item.ref)))
      .catch(() => setCredentialRefOptions([]));
  }, [allowed]);

  const openCreate = () => {
    reset(defaultFormValues);
    setLastCreatedId(null);
    setEditor({ open: true, mode: 'create', row: null });
  };

  const applyPreset = (preset) => {
    if (!preset?.values) return;
    reset({
      name: preset.values.name,
      type: preset.values.type,
      credential_ref: preset.values.credential_ref ?? '',
      config_json: preset.values.config_json,
    });
    toast.showInfo(`الگوی «${preset.label}» اعمال شد.`);
  };

  const openEdit = (row) => {
    reset({
      name: row.name,
      type: row.type,
      credential_ref: row.credential_ref || '',
      config_json: formatConfigJson(row.config_json),
    });
    setEditor({ open: true, mode: 'edit', row });
  };

  const closeEditor = () => {
    setEditor({ open: false, mode: 'create', row: null });
    setLastCreatedId(null);
    setEditorTestLoading(false);
    reset(defaultFormValues);
  };

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);
    const credentialRef = String(values.credential_ref ?? '').trim();
    try {
      const configJson = parseConfigJsonInput(values.config_json);
      if (editor.mode === 'create') {
        const created = await createConnector({
          name: values.name.trim(),
          type: values.type,
          credential_ref: credentialRef,
          config_json: configJson,
        });
        const newId = created?.id ?? null;
        setLastCreatedId(newId);
        toast.showSuccess('کانکتور با موفقیت ایجاد شد. می‌توانید اتصال را تست کنید.');
        if (newId) {
          setEditor({
            open: true,
            mode: 'edit',
            row: {
              id: newId,
              name: values.name.trim(),
              type: values.type,
              credential_ref: credentialRef,
              config_json: configJson,
            },
          });
        } else {
          closeEditor();
        }
      } else if (editor.row) {
        await updateConnector(editor.row.id, {
          name: values.name.trim(),
          type: values.type,
          credential_ref: credentialRef,
          config_json: configJson,
        });
        toast.showSuccess('کانکتور با موفقیت به‌روزرسانی شد.');
        closeEditor();
      }
      fetchData();
    } catch (error) {
      const msg = error?.message || 'خطا در ذخیره کانکتور';
      setErrorMessage(msg);
      toast.showError(msg);
    }
  });

  const confirmDelete = async () => {
    if (!deleteDialog.row) return;
    try {
      await deleteConnector(deleteDialog.row.id);
      toast.showSuccess('کانکتور غیرفعال شد.');
      setDeleteDialog({ open: false, row: null });
      fetchData();
    } catch (error) {
      setDeleteDialog({ open: false, row: null });
      const msg = error?.message || 'خطا در غیرفعال‌سازی کانکتور';
      setErrorMessage(msg);
      toast.showError(msg);
    }
  };

  const runTest = async (row, { silent = false } = {}) => {
    if (!row?.id) return null;
    if (!silent) {
      setTestDialog({ open: true, row, loading: true, result: null });
    }
    try {
      const result = await testConnector(row.id);
      if (!silent) {
        setTestDialog({ open: true, row, loading: false, result });
      }
      if (result.status === 'ok') {
        toast.showSuccess(`تست اتصال موفق — ${result.latency_ms} ms`);
      } else {
        toast.showError(result.message || 'تست اتصال ناموفق بود');
      }
      return result;
    } catch (error) {
      const result = {
        status: 'failed',
        latency_ms: 0,
        message: error?.message || 'خطا در تست اتصال',
      };
      if (!silent) {
        setTestDialog({ open: true, row, loading: false, result });
      }
      toast.showError(result.message);
      return result;
    }
  };

  const runEditorTest = async () => {
    const targetId = editor.row?.id ?? lastCreatedId;
    if (!targetId) {
      toast.showWarning('ابتدا کانکتور را ذخیره کنید.');
      return;
    }
    setEditorTestLoading(true);
    await runTest({ id: targetId, name: editor.row?.name }, { silent: false });
    setEditorTestLoading(false);
  };

  const columns = useMemo(
    () => [
      { field: 'name', headerName: 'نام', flex: 1, minWidth: 140 },
      {
        field: 'type',
        headerName: 'نوع',
        width: 130,
        renderCell: (params) => (
          <Chip size="small" label={params.row.type_label} variant="outlined" color="info" />
        ),
      },
      {
        field: 'is_active',
        headerName: 'وضعیت',
        width: 110,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value ? 'فعال' : 'غیرفعال'}
            color={params.value ? 'success' : 'default'}
            variant={params.value ? 'filled' : 'outlined'}
          />
        ),
      },
      {
        field: 'actions_count',
        headerName: 'تعداد اکشن',
        width: 120,
        renderCell: (params) => (
          <Button
            size="small"
            variant="text"
            onClick={() =>
              router.push(paths.dashboard.admin.integration.connectorActions(params.row.id))
            }
          >
            {params.value}
          </Button>
        ),
      },
      {
        field: 'operations',
        headerName: 'عملیات',
        width: 170,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="تست اتصال">
              <IconButton size="small" color="primary" onClick={() => runTest(params.row)} aria-label="تست اتصال">
                <Icon icon="solar:plug-circle-linear" width={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="ویرایش">
              <IconButton size="small" onClick={() => openEdit(params.row)} aria-label="ویرایش">
                <Icon icon="solar:pen-linear" width={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="غیرفعال‌سازی">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={!params.row.is_active}
                  onClick={() => setDeleteDialog({ open: true, row: params.row })}
                  aria-label="حذف"
                >
                  <Icon icon="solar:trash-bin-trash-linear" width={20} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [router]
  );

  if (!allowed) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">فقط مدیر مرکزی (central-admin) به کاتالوگ کانکتور دسترسی دارد.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          کاتالوگ کانکتور
        </Typography>
        <Button variant="contained" startIcon={<Icon icon="solar:add-circle-linear" width={20} />} onClick={openCreate}>
          کانکتور جدید
        </Button>
      </Stack>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}
      <Card sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            راهنمای جریان ادمین
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            ۱) کانکتور (مثلاً شاهکار) → ۲) اکشن → ۳) Process Binding روی sendAgency1 → ۴) تست اتصال
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {CONNECTOR_PRESETS.map((preset) => (
              <Chip
                key={preset.id}
                label={preset.label}
                clickable
                color="primary"
                variant="outlined"
                onClick={() => {
                  applyPreset(preset);
                  setEditor({ open: true, mode: 'create', row: null });
                }}
              />
            ))}
            <Chip
              label="Process Binding — sendAgency1"
              clickable
              variant="outlined"
              onClick={() =>
                router.push(
                  `${paths.dashboard.admin.integration.processIntegrations('service1')}?step=sendAgency1`
                )
              }
            />
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip
              label="همه"
              clickable
              color={statusFilter === 'all' ? 'primary' : 'default'}
              variant={statusFilter === 'all' ? 'filled' : 'outlined'}
              onClick={() => {
                setStatusFilter('all');
                setPaginationModel((p) => ({ ...p, page: 0 }));
              }}
            />
            <Chip
              label="فعال"
              clickable
              color={statusFilter === 'active' ? 'success' : 'default'}
              variant={statusFilter === 'active' ? 'filled' : 'outlined'}
              onClick={() => {
                setStatusFilter('active');
                setPaginationModel((p) => ({ ...p, page: 0 }));
              }}
            />
            <Chip
              label="غیرفعال"
              clickable
              color={statusFilter === 'inactive' ? 'default' : 'default'}
              variant={statusFilter === 'inactive' ? 'filled' : 'outlined'}
              onClick={() => {
                setStatusFilter('inactive');
                setPaginationModel((p) => ({ ...p, page: 0 }));
              }}
            />
          </Stack>

          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            loading={loading}
            rowCount={rowCount}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            sx={{ border: 0 }}
          />
        </CardContent>
      </Card>

      <Dialog open={editor.open} onClose={closeEditor} fullWidth maxWidth="md">
        <DialogTitle>{editor.mode === 'create' ? 'کانکتور جدید' : 'ویرایش کانکتور'}</DialogTitle>
        <Form methods={methods} onSubmit={onSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {editor.mode === 'create' ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {CONNECTOR_PRESETS.map((preset) => (
                    <Chip
                      key={preset.id}
                      size="small"
                      label={preset.label}
                      clickable
                      onClick={() => applyPreset(preset)}
                    />
                  ))}
                </Stack>
              ) : null}
              <Field.Text name="name" label="نام" />
              <Field.Select name="type" label="نوع کانکتور">
                {CONNECTOR_TYPES.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Autocomplete
                name="credential_ref"
                label="ارجاع اعتبار (credential ref)"
                placeholder="cred://prod/example"
                options={credentialRefOptions}
                freeSolo
                getOptionLabel={(opt) => (typeof opt === 'string' ? opt : '')}
                slotProps={{
                  textField: {
                    slotProps: {
                      input: { sx: { fontFamily: 'monospace', direction: 'ltr' } },
                    },
                  },
                }}
              />
              <Field.Text
                name="config_json"
                label="پیکربندی JSON"
                multiline
                minRows={8}
                slotProps={{
                  input: {
                    sx: {
                      fontFamily: 'monospace',
                      direction: 'ltr',
                      textAlign: 'left',
                    },
                  },
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
            {editor.mode === 'edit' || lastCreatedId ? (
              <LoadingButton
                variant="outlined"
                color="primary"
                loading={editorTestLoading}
                onClick={runEditorTest}
                startIcon={<Icon icon="solar:plug-circle-linear" width={18} />}
              >
                تست اتصال
              </LoadingButton>
            ) : null}
            {(editor.row?.id ?? lastCreatedId) ? (
              <Button
                variant="text"
                onClick={() =>
                  router.push(
                    paths.dashboard.admin.integration.connectorActions(editor.row?.id ?? lastCreatedId)
                  )
                }
              >
                مدیریت اکشن‌ها
              </Button>
            ) : null}
            <Box sx={{ flexGrow: 1 }} />
            <Button onClick={closeEditor}>انصراف</Button>
            <LoadingButton type="submit" variant="contained" loading={formState.isSubmitting}>
              ذخیره
            </LoadingButton>
          </DialogActions>
        </Form>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, row: null })}>
        <DialogTitle>غیرفعال‌سازی کانکتور</DialogTitle>
        <DialogContent>
          <DialogContentText>
            کانکتور «{deleteDialog.row?.name}» غیرفعال می‌شود (حذف نرم). اکشن‌های مرتبط همچنان در پایگاه داده باقی
            می‌مانند.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, row: null })}>انصراف</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            غیرفعال‌سازی
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={testDialog.open} onClose={() => setTestDialog({ open: false, row: null, loading: false, result: null })}>
        <DialogTitle>تست اتصال — {testDialog.row?.name}</DialogTitle>
        <DialogContent>
          {testDialog.loading ? (
            <Typography variant="body2" color="text.secondary">
              در حال بررسی اتصال…
            </Typography>
          ) : testDialog.result ? (
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <Chip
                size="small"
                label={testDialog.result.status === 'ok' ? 'موفق' : 'ناموفق'}
                color={testDialog.result.status === 'ok' ? 'success' : 'error'}
              />
              <Typography variant="body2">
                تأخیر: {testDialog.result.latency_ms} ms
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {testDialog.result.message}
              </Typography>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialog({ open: false, row: null, loading: false, result: null })}>بستن</Button>
          {testDialog.row ? (
            <Button variant="outlined" onClick={() => runTest(testDialog.row)} disabled={testDialog.loading}>
              تکرار تست
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
