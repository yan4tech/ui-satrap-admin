'use client';

import { z as zod } from 'zod';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { paths } from 'src/routes/paths';

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
} from '@mui/material';

import { DataGrid } from '@mui/x-data-grid';

import { Icon } from '@iconify/react';

import { Form, Field } from 'src/components/hook-form';

// --------------------------------------
// SCHEMA
// --------------------------------------
const SearchSchema = zod.object({
  title: zod.string().optional(),
  province: zod.string().optional(),
  city: zod.string().optional(),
  is_active: zod.string().optional(),
});

// --------------------------------------

const BranchSearch = () => {
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [cities, setCities] = useState([]);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 5,
  });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    row: null,
  });

  const provinces = [
    { id: 1, name: 'تهران' },
    { id: 2, name: 'اصفهان' },
  ];

  const fetchCitiesByProvince = async (provinceId) => {
    const data = {
      1: [
        { id: 10, name: 'تهران' },
        { id: 11, name: 'اسلامشهر' },
      ],
      2: [
        { id: 20, name: 'اصفهان' },
        { id: 21, name: 'کاشان' },
      ],
    };
    return data[provinceId] || [];
  };

  const searchBranches = async (filters, page, pageSize) => {
    const allData = Array.from({ length: 37 }).map((_, i) => ({
      id: i + 1,
      title: `شعبه ${i + 1}`,
      province: i % 2 === 0 ? 'تهران' : 'اصفهان',
      city: i % 2 === 0 ? 'تهران' : 'کاشان',
      phone: '021123456',
      is_active: i % 2 === 0,
    }));

    const start = page * pageSize;
    const end = start + pageSize;

    return {
      data: allData.slice(start, end),
      total: allData.length,
    };
  };

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: {
      title: '',
      province: '',
      city: '',
      is_active: '',
    },
  });

  const { handleSubmit, watch, setValue, getValues } = methods;

  const selectedProvince = watch('province');

  useEffect(() => {
    if (!selectedProvince) return;

    const load = async () => {
      const res = await fetchCitiesByProvince(selectedProvince);
      setCities(res);
      setValue('city', '');
    };

    load();
  }, [selectedProvince, setValue]);

  const fetchData = useCallback(async () => {
    const filters = getValues();

    const res = await searchBranches(filters, paginationModel.page, paginationModel.pageSize);

    setRows(res.data);
    setRowCount(res.total);
  }, [paginationModel, getValues]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = handleSubmit(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    fetchData();
  });

  const handleEdit = (row) => {
    router.push(paths.dashboard.branch.edit(row.id));
  };
  const handleDetails = (row) => console.log('Details:', row);

  const openDeleteDialog = (row) => {
    setDeleteDialog({ open: true, row });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, row: null });
  };

  const confirmDelete = () => {
    setRows((prev) => prev.filter((r) => r.id !== deleteDialog.row.id));
    setRowCount((prev) => prev - 1);
    closeDeleteDialog();
  };

  const columns = [
    { field: 'title', headerName: 'عنوان', flex: 1 },
    { field: 'province', headerName: 'استان', flex: 1 },
    { field: 'city', headerName: 'شهر', flex: 1 },
    { field: 'phone', headerName: 'تلفن', flex: 1 },
    {
      field: 'is_active',
      headerName: 'وضعیت',
      renderCell: (params) => (params.value ? 'فعال' : 'غیرفعال'),
    },
    {
      field: 'actions',
      headerName: 'عملیات',
      flex: 1.5,
      sortable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="جزئیات">
            <IconButton onClick={() => handleDetails(params.row)}>
              <Icon icon="mdi:eye-outline" width="20" height="20" />
            </IconButton>
          </Tooltip>

          <Tooltip title="ویرایش">
            <IconButton onClick={() => handleEdit(params.row)}>
              <Icon icon="mdi:pencil-outline" width="20" height="20" />
            </IconButton>
          </Tooltip>

          <Tooltip title="حذف">
            <IconButton color="error" onClick={() => openDeleteDialog(params.row)}>
              <Icon icon="mdi:delete-outline" width="20" height="20" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            جستجوی شعب
          </Typography>

          <Form methods={methods} onSubmit={onSubmit}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Field.Text name="title" label="عنوان" />
              </Grid>

              <Grid item xs={12} md={3}>
                <Field.Select name="province" label="استان">
                  {provinces.map((p) => (
                    <MenuItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>

              <Grid item xs={12} md={3}>
                <Field.Select name="city" label="شهر" disabled={!selectedProvince}>
                  {cities.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>

              <Grid item xs={12} md={3}>
                <Field.Select name="is_active" label="وضعیت">
                  <MenuItem value="">همه</MenuItem>
                  <MenuItem value="true">فعال</MenuItem>
                  <MenuItem value="false">غیرفعال</MenuItem>
                </Field.Select>
              </Grid>

              <Grid item xs={12}>
                <Button type="submit" variant="contained">
                  جستجو
                </Button>
              </Grid>
            </Grid>
          </Form>

          <Box sx={{ height: 400 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              rowCount={rowCount}
              paginationMode="server"
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[5, 10, 20]}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={deleteDialog.open} onClose={closeDeleteDialog}>
        <DialogTitle>حذف شعبه</DialogTitle>
        <DialogContent>
          <DialogContentText>آیا از حذف این شعبه مطمئن هستید؟</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>انصراف</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BranchSearch;
