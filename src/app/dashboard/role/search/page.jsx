'use client';

import { z as zod } from 'zod';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
  Divider,
  Chip,
} from '@mui/material';

import { LoadingButton } from '@mui/lab';
import { DataGrid } from '@mui/x-data-grid';
import { Icon } from '@iconify/react';

import { Form, Field } from 'src/components/hook-form';
import { paths } from 'src/routes/paths';
import axios from 'src/lib/axios';

const SearchSchema = zod.object({
  title: zod.string().optional(),
  slug: zod.string().optional(),
  description: zod.string().optional(),
  active: zod.string().optional(),
});

export default function RoleSearchPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [permissionMap, setPermissionMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [isSearchOpen, setIsSearchOpen] = useState(true);

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: { title: '', slug: '', description: '', active: '' },
  });

  const { handleSubmit, watch, setValue, getValues, reset } = methods;
  const isActiveValue = watch('active');

  const fetchPermissions = useCallback(async () => {
    try {
      const limit = 100;
      let offset = 0;
      let all = [];
      let shouldContinue = true;

      while (shouldContinue) {
        const res = await axios.get('/api/membership/ac/permission', {
          headers: {
            mode: 'company',
            limit: String(limit),
            offset: String(offset),
          },
        });

        const payload = res?.data ?? {};
        const batch = Array.isArray(payload?.data) ? payload.data : [];
        all = all.concat(batch);

        if (batch.length < limit) {
          shouldContinue = false;
        } else {
          offset += limit;
        }
      }

      const map = {};
      all.forEach((item) => {
        const id = Number(item?.ID ?? item?.id);
        if (!Number.isNaN(id)) {
          map[id] = {
            id,
            title: item?.title ?? '',
            slug: item?.slug ?? '',
          };
        }
      });
      setPermissionMap(map);
    } catch (error) {
      console.error('Failed to fetch permissions for roles:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const filters = getValues();
      const params = {};
      if (filters.title) params.title = filters.title;
      if (filters.slug) params.slug = filters.slug;
      if (filters.description) params.description = filters.description;
      if (filters.active !== '') params.active = filters.active;

      const res = await axios.get('/api/membership/ac/role', {
        params,
        headers: {
          mode: 'company',
          limit: String(paginationModel.pageSize),
          offset: String(paginationModel.page * paginationModel.pageSize),
        },
      });

      const payload = res?.data ?? {};
      const rawRows = Array.isArray(payload?.data) ? payload.data : [];
      const mappedRows = rawRows.map((item) => {
        const permissionIds = Array.isArray(item?.permission_ids) ? item.permission_ids : [];
        const fromEmbedded = Array.isArray(item?.permissions)
          ? item.permissions.map((permission) => ({
              id: Number(permission?.ID ?? permission?.id),
              title: permission?.title ?? '',
              slug: permission?.slug ?? '',
            }))
          : [];
        const fromIds = permissionIds
          .map((permissionId) => permissionMap[Number(permissionId)])
          .filter(Boolean);

        const resolvedPermissions = fromEmbedded.length > 0 ? fromEmbedded : fromIds;

        return {
          id: item?.ID ?? item?.id,
          title: item?.title ?? '',
          slug: item?.slug ?? '',
          description: item?.description ?? '',
          active: Boolean(item?.active),
          permissions: resolvedPermissions,
        };
      });

      setRows(mappedRows);
      setRowCount(Number(payload?.total ?? payload?.count ?? mappedRows.length));
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setRows([]);
      setRowCount(0);
      setErrorMessage(error?.response?.data?.message || error?.response?.data?.error || 'خطا در دریافت لیست نقش‌ها');
    } finally {
      setLoading(false);
    }
  }, [paginationModel, getValues, permissionMap]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    fetchData();
  }, [fetchData, permissionMap]);

  const onSubmit = handleSubmit(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
    fetchData();
  });

  const columns = [
    { field: 'title', headerName: 'عنوان', flex: 1 },
    { field: 'slug', headerName: 'اسلاگ', flex: 1 },
    {
      field: 'permissions',
      headerName: 'دسترسی‌ها',
      flex: 1.5,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ py: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {(params.value || []).slice(0, 4).map((permission) => (
            <Chip key={permission?.ID ?? permission?.id ?? permission?.slug} label={permission?.title || permission?.slug || '—'} size="small" variant="outlined" />
          ))}
          {(params.value || []).length > 4 && (
            <Chip size="small" label={`+${params.value.length - 4}`} />
          )}
        </Box>
      ),
    },
    {
      field: 'active',
      headerName: 'وضعیت',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'فعال' : 'غیرفعال'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'عملیات',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="ویرایش">
            <IconButton onClick={() => router.push(paths.dashboard.role.edit(params.row.id))}>
              <Icon icon="mdi:pencil-outline" width="20" />
            </IconButton>
          </Tooltip>
          <Tooltip title="حذف">
            <IconButton color="error" onClick={() => setDeleteDialog({ open: true, row: params.row })}>
              <Icon icon="mdi:delete-outline" width="20" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  const confirmDelete = () => {
    if (!deleteDialog.row) return;
    axios
      .delete(`/api/membership/ac/role/${deleteDialog.row.id}`, {
        headers: { mode: 'company' },
      })
      .then(() => {
        setDeleteDialog({ open: false, row: null });
        fetchData();
      })
      .catch((error) => {
        setDeleteDialog({ open: false, row: null });
        setErrorMessage(error?.response?.data?.message || error?.response?.data?.error || 'خطا در حذف نقش');
      });
  };

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<Icon icon="mdi:plus" width="20" />}
          onClick={() => router.push(paths.dashboard.role.create)}
        >
          نقش جدید
        </Button>
      </Box>

      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: (theme) => theme.shadows[2],
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box
            sx={{
              mb: 2.5,
              px: 2,
              py: 1.5,
              borderRadius: 2,
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
            }}
            onClick={() => setIsSearchOpen((prev) => !prev)}
          >
            <Icon
              icon={isSearchOpen ? 'solar:alt-arrow-down-linear' : 'solar:alt-arrow-left-linear'}
              width={18}
            />
            <Icon icon="solar:filter-linear" width={20} />
            <Typography variant="h6">فیلتر نقش‌ها</Typography>
          </Box>
          <Collapse in={isSearchOpen}>
            <Form methods={methods} onSubmit={onSubmit}>
              <Stack spacing={2}>
                <Divider />
                <Box
                  sx={{
                    p: { xs: 1, md: 2 },
                    borderRadius: 2,
                    bgcolor: 'background.neutral',
                    border: '1px dashed',
                    borderColor: 'divider',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                    columnGap: 3,
                    rowGap: 2,
                  }}
                >
                  <Box>
                    <Field.Text name="title" label="عنوان / اسلاگ / توضیح" />
                  </Box>
                  <Box>
                    <Field.Text name="slug" label="اسلاگ" />
                  </Box>
                  <Box>
                    <Field.Text name="description" label="توضیحات" />
                  </Box>
                  <Box>
                    <Box sx={{ pt: 1 }}>
                      <Typography sx={{ mb: 1 }} variant="body2">
                        وضعیت
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant={isActiveValue === '' ? 'contained' : 'outlined'}
                          onClick={() => setValue('active', '')}
                        >
                          همه
                        </Button>
                        <Button
                          size="small"
                          color="success"
                          variant={isActiveValue === 'true' ? 'contained' : 'outlined'}
                          onClick={() => setValue('active', 'true')}
                        >
                          فعال
                        </Button>
                        <Button
                          size="small"
                          variant={isActiveValue === 'false' ? 'contained' : 'outlined'}
                          onClick={() => setValue('active', 'false')}
                        >
                          غیرفعال
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                </Box>
                <Box
                  sx={{
                    pt: 2,
                    borderTop: '1px dashed',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1,
                  }}
                >
                  <Button onClick={() => reset()}>پاک کردن</Button>
                  <LoadingButton type="submit" variant="contained">
                    جستجو
                  </LoadingButton>
                </Box>
              </Stack>
            </Form>
          </Collapse>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {!!errorMessage && (
            <DialogContentText color="error" sx={{ mb: 2 }}>
              {errorMessage}
            </DialogContentText>
          )}
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h5">لیست نقش‌ها</Typography>
            <Chip size="small" variant="outlined" color="primary" label={`${rowCount} رکورد`} />
          </Stack>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            rowCount={rowCount}
            loading={loading}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            autoHeight
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: 'background.neutral',
                borderBottom: '1px solid',
                borderColor: 'divider',
              },
              '& .MuiDataGrid-row:nth-of-type(even)': {
                bgcolor: 'action.hover',
              },
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, row: null })}>
        <DialogTitle>حذف نقش</DialogTitle>
        <DialogContent>
          <DialogContentText>
            نقش حذف شود؟ کاربرانی که این نقش را دارند بدون نقش می‌مانند تا نقش جدید بگیرند.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, row: null })}>انصراف</Button>
          <Button color="error" onClick={confirmDelete}>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
