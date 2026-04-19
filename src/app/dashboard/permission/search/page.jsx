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
  Grid,
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
  searchPermissions,
  deletePermission,
} from 'src/app/dashboard/_lib/access-control-mock';

const SearchSchema = zod.object({
  title: zod.string().optional(),
  permission_type: zod.string().optional(),
  active: zod.string().optional(),
});

export default function PermissionSearchPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: { title: '', permission_type: '', active: '' },
  });

  const { handleSubmit, watch, setValue, getValues, reset } = methods;
  const isActiveValue = watch('active');

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
  const handleDetails = (row) => router.push(paths.dashboard.permission.details(row.id));

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
    { field: 'permission_type', headerName: 'نوع', width: 110 },
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
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="جزئیات">
            <IconButton onClick={() => handleDetails(params.row)}>
              <Icon icon="mdi:eye-outline" width="20" />
            </IconButton>
          </Tooltip>
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
      <Paper sx={{ p: 2, mb: 3 }}>
        <Form methods={methods} onSubmit={onSubmit}>
          <Stack spacing={2}>
            <Typography variant="h6">فیلتر دسترسی‌ها</Typography>
            <Divider />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Field.Text name="title" label="عنوان / اسلاگ / توضیح" />
              </Grid>
              <Grid item xs={12} md={4}>
                <Field.Select name="permission_type" label="نوع" placeholder="همه">
                  <MenuItem value="">همه</MenuItem>
                  {PERMISSION_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ pt: 1 }}>
                  <Typography sx={{ mb: 1 }} variant="body2">
                    فعال بودن
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
                      color="inherit"
                      variant={isActiveValue === 'false' ? 'contained' : 'outlined'}
                      onClick={() => setValue('active', 'false')}
                    >
                      غیرفعال
                    </Button>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button onClick={() => reset()}>پاک کردن</Button>
              <LoadingButton type="submit" variant="contained">
                جستجو
              </LoadingButton>
            </Stack>
          </Stack>
        </Form>
      </Paper>

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
