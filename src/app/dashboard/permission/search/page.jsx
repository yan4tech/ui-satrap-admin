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
  MenuItem,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  Stack,
  Divider,
  Chip,
} from '@mui/material';

import { LoadingButton } from '@mui/lab';
import { DataGrid } from '@mui/x-data-grid';
import { Icon } from '@iconify/react';

import { Form, Field } from 'src/components/hook-form';
import { paths } from 'src/routes/paths';

import {
  PERMISSION_TYPES,
  API_METHODS,
  searchPermissions,
  deletePermission,
} from 'src/app/dashboard/_lib/access-control-mock';

const SearchSchema = zod.object({
  title: zod.string().optional(),
  permission_type: zod.string().optional(),
  api_method: zod.string().optional(),
  active: zod.string().optional(),
});

export default function PermissionSearchPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [isSearchOpen, setIsSearchOpen] = useState(true);

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: { title: '', permission_type: '', api_method: '', active: '' },
  });

  const { handleSubmit, watch, setValue, getValues, reset } = methods;
  const isActiveValue = watch('active');
  const selectedPermissionType = watch('permission_type');

  useEffect(() => {
    if (selectedPermissionType !== 'API') {
      setValue('api_method', '');
    }
  }, [selectedPermissionType, setValue]);

  const fetchData = useCallback(async () => {
    const filters = getValues();
    const res = searchPermissions(filters, paginationModel.page, paginationModel.pageSize);
    setRows(res.data.map((r) => ({ ...r })));
    setRowCount(res.total);
  }, [paginationModel, getValues]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = handleSubmit(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
    fetchData();
  });

  const handleEdit = (row) => router.push(paths.dashboard.permission.edit(row.id));

  const openDeleteDialog = (row) => setDeleteDialog({ open: true, row });
  const closeDeleteDialog = () => setDeleteDialog({ open: false, row: null });

  const confirmDelete = () => {
    if (deleteDialog.row) {
      deletePermission(deleteDialog.row.id);
      closeDeleteDialog();
      fetchData();
    }
  };

  const columns = [
    { field: 'title', headerName: 'عنوان', flex: 1 },
    { field: 'slug', headerName: 'اسلاگ', flex: 1 },
    {
      field: 'permission_type',
      headerName: 'نوع',
      width: 130,
      renderCell: (params) => {
        const colorByType = {
          API: 'info',
          UI: 'primary',
          SERVICE: 'warning',
          PROCESS: 'secondary',
        };
        return (
          <Chip
            label={params.value}
            color={colorByType[params.value] || 'default'}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'api_path',
      headerName: 'ApiPath',
      flex: 1.1,
      renderCell: (params) => (params.row.permission_type === 'API' ? (params.value || '—') : '—'),
    },
    {
      field: 'api_method',
      headerName: 'ApiMethod',
      width: 120,
      renderCell: (params) =>
        params.row.permission_type === 'API' ? (
          <Chip label={params.value || '—'} color="info" size="small" variant="outlined" />
        ) : (
          '—'
        ),
    },
    { field: 'process', headerName: 'Process', width: 90 },
    {
      field: 'active',
      headerName: 'وضعیت',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'فعال' : 'غیرفعال'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'عملیات',
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="ویرایش">
            <IconButton onClick={() => handleEdit(params.row)}>
              <Icon icon="mdi:pencil-outline" width="20" />
            </IconButton>
          </Tooltip>
          <Tooltip title="حذف">
            <IconButton color="error" onClick={() => openDeleteDialog(params.row)}>
              <Icon icon="mdi:delete-outline" width="20" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<Icon icon="mdi:plus" width="20" />}
          onClick={() => router.push(paths.dashboard.permission.create)}
        >
          دسترسی جدید
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
            <Typography variant="h6">فیلتر دسترسی‌ها</Typography>
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
                    <Field.Select name="permission_type" label="نوع" placeholder="همه">
                      <MenuItem value="">همه</MenuItem>
                      {PERMISSION_TYPES.map((t) => (
                        <MenuItem key={t} value={t}>
                          {t}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Box>
                  {selectedPermissionType === 'API' && (
                    <Box>
                      <Field.Select name="api_method" label="ApiMethod" placeholder="همه">
                        <MenuItem value="">همه</MenuItem>
                        {API_METHODS.map((method) => (
                          <MenuItem key={method} value={method}>
                            {method}
                          </MenuItem>
                        ))}
                      </Field.Select>
                    </Box>
                  )}
                  <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                    <Field.Text name="title" label="عنوان / اسلاگ / توضیح / ApiPath / ApiMethod" />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
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
                          color="error"
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
          <Typography variant="h5" sx={{ mb: 2 }}>
            لیست دسترسی‌ها
          </Typography>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            rowCount={rowCount}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            autoHeight
          />
        </CardContent>
      </Card>

      <Dialog open={deleteDialog.open} onClose={closeDeleteDialog}>
        <DialogTitle>حذف دسترسی</DialogTitle>
        <DialogContent>
          <DialogContentText>این دسترسی حذف شود؟ از نقش‌های مرتبط هم برداشته می‌شود.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>انصراف</Button>
          <Button color="error" onClick={confirmDelete}>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
