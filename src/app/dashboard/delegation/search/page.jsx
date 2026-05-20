'use client';

import { z as zod } from 'zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';

import { LoadingButton } from '@mui/lab';
import { DataGrid } from '@mui/x-data-grid';
import { Icon } from '@iconify/react';

import { Form, Field } from 'src/components/hook-form';
import {
  createDelegation,
  deleteDelegation,
  fetchDelegations,
  fetchRolesOptions,
} from '../delegation-api';

const SearchSchema = zod.object({
  actor_role_id: zod.string().optional(),
  assignable_role_id: zod.string().optional(),
});

const CreateSchema = zod.object({
  actor_role_id: zod.number().min(1, 'نقش مبدأ را انتخاب کنید'),
  assignable_role_id: zod.number().min(1, 'نقش قابل انتساب را انتخاب کنید'),
});

export default function DelegationSearchPage() {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [createError, setCreateError] = useState(null);

  const searchMethods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: { actor_role_id: '', assignable_role_id: '' },
  });

  const createMethods = useForm({
    resolver: zodResolver(CreateSchema),
    defaultValues: { actor_role_id: 0, assignable_role_id: 0 },
  });

  const { handleSubmit: handleSearchSubmit, getValues, reset: resetSearch } = searchMethods;
  const {
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    setValue: setCreateValue,
    watch: watchCreate,
  } = createMethods;

  const createActorId = watchCreate('actor_role_id');
  const createAssignableId = watchCreate('assignable_role_id');

  const loadRoles = useCallback(async () => {
    try {
      const list = await fetchRolesOptions();
      setRoles(list);
    } catch {
      setErrorMessage('خطا در دریافت لیست نقش‌ها');
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const filters = getValues();
      const data = await fetchDelegations({
        actor_role_id: filters.actor_role_id || undefined,
        assignable_role_id: filters.assignable_role_id || undefined,
      });
      setRows(data);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'خطا در دریافت لیست delegation');
    } finally {
      setLoading(false);
    }
  }, [getValues]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = handleSearchSubmit(() => {
    fetchData();
  });

  const openCreateDialog = () => {
    setCreateError(null);
    resetCreate({ actor_role_id: 0, assignable_role_id: 0 });
    setCreateOpen(true);
  };

  const onCreate = handleCreateSubmit(async (data) => {
    setCreateError(null);
    try {
      if (data.actor_role_id === data.assignable_role_id) {
        setCreateError('نقش مبدأ و مقصد نباید یکسان باشند');
        return;
      }
      await createDelegation(data.actor_role_id, data.assignable_role_id);
      setCreateOpen(false);
      fetchData();
    } catch (err) {
      setCreateError(err?.response?.data?.message || 'خطا در ثبت delegation');
    }
  });

  const confirmDelete = async () => {
    if (!deleteDialog.row) return;
    try {
      await deleteDelegation(deleteDialog.row.id);
      setDeleteDialog({ open: false, row: null });
      fetchData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'خطا در حذف');
      setDeleteDialog({ open: false, row: null });
    }
  };

  const columns = [
    { field: 'id', headerName: 'شناسه', width: 90 },
    {
      field: 'actor_role_title',
      headerName: 'نقش مبدأ (actor)',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">{params.row.actor_role_title}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.actor_role_slug}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'assignable_role_title',
      headerName: 'نقش قابل انتساب',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">{params.row.assignable_role_title}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.assignable_role_slug}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'عملیات',
      width: 90,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="حذف">
          <IconButton color="error" onClick={() => setDeleteDialog({ open: true, row: params.row })}>
            <Icon icon="mdi:delete-outline" width="20" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const roleOptionLabel = (r) => `${r.title} (${r.slug})`;

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          تعریف می‌کند هر نقش (actor) هنگام ایجاد کاربر، چه نقش‌هایی را می‌تواند به دیگران اختصاص دهد.
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<Icon icon="mdi:plus" width="20" />}
          onClick={openCreateDialog}
        >
          delegation جدید
        </Button>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Box
            sx={{
              mb: 2,
              px: 2,
              py: 1.5,
              borderRadius: 2,
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
            }}
            onClick={() => setIsSearchOpen((p) => !p)}
          >
            <Icon icon={isSearchOpen ? 'solar:alt-arrow-down-linear' : 'solar:alt-arrow-left-linear'} width={18} />
            <Icon icon="solar:filter-linear" width={20} />
            <Typography variant="h6">فیلتر</Typography>
          </Box>
          <Collapse in={isSearchOpen}>
            <Form methods={searchMethods} onSubmit={onSearch}>
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <Field.Select name="actor_role_id" label="نقش مبدأ">
                    <MenuItem value="">همه</MenuItem>
                    {roles.map((r) => (
                      <MenuItem key={r.id} value={String(r.id)}>
                        {roleOptionLabel(r)}
                      </MenuItem>
                    ))}
                  </Field.Select>
                  <Field.Select name="assignable_role_id" label="نقش قابل انتساب">
                    <MenuItem value="">همه</MenuItem>
                    {roles.map((r) => (
                      <MenuItem key={r.id} value={String(r.id)}>
                        {roleOptionLabel(r)}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button onClick={() => resetSearch()}>پاک کردن</Button>
                  <LoadingButton type="submit" variant="contained">
                    جستجو
                  </LoadingButton>
                </Box>
              </Stack>
            </Form>
          </Collapse>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          localeText={{ noRowsLabel: 'رکوردی یافت نشد' }}
        />
      </Card>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>delegation جدید</DialogTitle>
        <Form methods={createMethods} onSubmit={onCreate}>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              نقش مبدأ (کسی که کاربر می‌سازد) می‌تواند نقش مقصد را به کاربر جدید اختصاص دهد.
            </DialogContentText>
            {createError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createError}
              </Alert>
            )}
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Autocomplete
                options={roles}
                getOptionLabel={roleOptionLabel}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                value={roles.find((r) => r.id === Number(createActorId)) || null}
                onChange={(_, v) => setCreateValue('actor_role_id', v?.id ?? 0, { shouldValidate: true })}
                renderInput={(params) => <TextField {...params} label="نقش مبدأ (actor)" required />}
              />
              <Autocomplete
                options={roles.filter((r) => r.id !== Number(createActorId))}
                getOptionLabel={roleOptionLabel}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                value={roles.find((r) => r.id === Number(createAssignableId)) || null}
                onChange={(_, v) =>
                  setCreateValue('assignable_role_id', v?.id ?? 0, { shouldValidate: true })
                }
                renderInput={(params) => <TextField {...params} label="نقش قابل انتساب" required />}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)}>انصراف</Button>
            <LoadingButton type="submit" variant="contained">
              ثبت
            </LoadingButton>
          </DialogActions>
        </Form>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, row: null })}>
        <DialogTitle>حذف delegation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            آیا از حذف ارتباط «{deleteDialog.row?.actor_role_title}» → «
            {deleteDialog.row?.assignable_role_title}» مطمئن هستید؟
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, row: null })}>انصراف</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
