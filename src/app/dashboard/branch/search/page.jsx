'use client';

import { z as zod } from 'zod';
import { useEffect, useState, useCallback } from 'react';
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
  ButtonGroup,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
  Chip,
} from '@mui/material';

import { LoadingButton } from '@mui/lab';
import { DataGrid } from '@mui/x-data-grid';
import { Icon } from '@iconify/react';

import { Form, Field } from 'src/components/hook-form';
import { paths } from 'src/routes/paths';
import axios from 'src/lib/axios';

// ---------------------- SCHEMA ----------------------
const SearchSchema = zod.object({
  branch_number: zod.string().optional(),
  title: zod.string().optional(),
  phone: zod.string().optional(),
  ip: zod.string().optional(),
  province: zod.number().optional(),
  city: zod.number().optional(),
  is_active: zod.string().optional(),
  from_date: zod.any().optional(),
  to_date: zod.any().optional(),
});

const BranchSearch = () => {
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [cities, setCities] = useState([]);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [isSearchOpen, setIsSearchOpen] = useState(true);

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    row: null,
  });

  const provinces = [
    { id: 1, name: 'تهران' },
    { id: 2, name: 'اصفهان' },
  ];
  const allCities = [
    { id: 10, name: 'تهران' },
    { id: 11, name: 'اسلامشهر' },
    { id: 20, name: 'اصفهان' },
    { id: 21, name: 'کاشان' },
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
    const params = {
      limit: pageSize,
      offset: page * pageSize,
    };

    if (filters.branch_number) params.branch_number = filters.branch_number;
    if (filters.title) params.title = filters.title;
    if (filters.phone) params.phone = filters.phone;
    if (filters.ip) params.ip = filters.ip;
    if (filters.province) params.province = filters.province;
    if (filters.city) params.city = filters.city;
    if (filters.is_active !== '') params.is_active = filters.is_active;

    const res = await axios.get('/api/membership/branch', {
      params,
      headers: { mode: 'company' },
    });

    const payload = res?.data ?? {};
    const data = Array.isArray(payload?.data) ? payload.data : [];
    const mapped = data.map((item) => ({
      id: item.ID,
      title: item.title || '-',
      province: provinces.find((p) => p.id === item.province)?.name || item.province || '-',
      city: allCities.find((c) => c.id === item.city)?.name || item.city || '-',
      ip: item.ip || '-',
      phone: item.phone || '-',
      is_active: Boolean(item.is_active),
    }));

    return {
      data: mapped,
      total: Number(payload?.total ?? payload?.count ?? mapped.length),
    };
  };

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: {
      branch_number: '',
      title: '',
      phone: '',
      ip: '',
      province: undefined,
      city: undefined,
      is_active: '',
      from_date: null,
      to_date: null,
    },
  });

  const { handleSubmit, watch, setValue, getValues, reset } = methods;

  const selectedProvince = watch('province');
  const selectedCity = watch('city');
  const isActiveValue = watch('is_active');

  // province -> city
  useEffect(() => {
    const load = async () => {
      if (!selectedProvince) {
        setCities([]);
        setValue('city', undefined);
        return;
      }

      const res = await fetchCitiesByProvince(selectedProvince);
      setCities(res);
      setValue('city', undefined);
    };

    load();
  }, [selectedProvince, setValue]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = getValues();
      const res = await searchBranches(filters, paginationModel.page, paginationModel.pageSize);
      setRows(res.data);
      setRowCount(res.total);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [paginationModel, getValues]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = handleSubmit(() => {
    if (paginationModel.page === 0) {
      fetchData();
      return;
    }
    setPaginationModel((p) => ({ ...p, page: 0 }));
  });

  const handleEdit = (row) => router.push(paths.dashboard.branch.edit(row.id));
  const handleDetails = (row) => router.push(paths.dashboard.branch.details(row.id));

  const openDeleteDialog = (row) => setDeleteDialog({ open: true, row });
  const closeDeleteDialog = () => setDeleteDialog({ open: false, row: null });

  const confirmDelete = async () => {
    if (!deleteDialog.row?.id) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/membership/branch/${deleteDialog.row.id}`, {
        headers: { mode: 'company' },
      });
      closeDeleteDialog();
      await fetchData();
    } catch (error) {
      console.error('Failed to delete branch:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { field: 'id', headerName: 'شناسه', flex: 0.7 },
    { field: 'title', headerName: 'عنوان', flex: 1 },
    { field: 'province', headerName: 'استان', flex: 1 },
    { field: 'city', headerName: 'شهر', flex: 1 },
    { field: 'ip', headerName: 'IP', flex: 1 },
    { field: 'phone', headerName: 'تلفن', flex: 1 },
    {
      field: 'is_active',
      headerName: 'وضعیت',
      flex: 1,
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
      flex: 1.5,
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
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: (theme) => theme.shadows[3],
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
            <Typography variant="h6">فیلتر جستجوی شعب</Typography>
          </Box>

          <Collapse in={isSearchOpen}>
            <Form methods={methods} onSubmit={onSubmit}>
              <Stack spacing={2}>
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
                    <Field.Text name="branch_number" label="شماره شعبه" />
                  </Box>

                  <Box>
                    <Field.Text name="title" label="عنوان شعبه" />
                  </Box>

                  <Box>
                    <Field.Text name="phone" label="تلفن" />
                  </Box>

                  <Box>
                    <Field.Text name="ip" label="IP" />
                  </Box>

                  <Box>
                    <Field.Select name="province" label="استان" placeholder="انتخاب استان">
                      {provinces.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Box>

                  <Box>
                    <Field.Select
                      name="city"
                      label="شهر"
                      disabled={!selectedProvince}
                      placeholder="انتخاب شهر"
                    >
                      {cities.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Box>

                  {/* <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Grid
                    container
                    spacing={2}
                    sx={{
                      p: { xs: 1, md: 2 },
                      borderRadius: 2,
                      border: '1px dashed',
                      borderColor: 'divider',
                    }}
                  >
                    <Grid item xs={12} md={3}>
                      <DatePicker
                        label="از تاریخ"
                        value={watch('from_date')}
                        onChange={(v) => setValue('from_date', v)}
                        format="YYYY/MM/DD"
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <DatePicker
                        label="تا تاریخ"
                        value={watch('to_date')}
                        onChange={(v) => setValue('to_date', v)}
                        format="YYYY/MM/DD"
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>
                  </Grid>
                </LocalizationProvider> */}

                  <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                    <Typography sx={{ mb: 1 }}>وضعیت:</Typography>
                    <ButtonGroup>
                      <Button
                        variant={isActiveValue === '' ? 'contained' : 'outlined'}
                        onClick={() => setValue('is_active', '')}
                      >
                        همه
                      </Button>

                      <Button
                        color="success"
                        variant={isActiveValue === 'true' ? 'contained' : 'outlined'}
                        onClick={() => setValue('is_active', 'true')}
                      >
                        فعال
                      </Button>

                      <Button
                        color="error"
                        variant={isActiveValue === 'false' ? 'contained' : 'outlined'}
                        onClick={() => setValue('is_active', 'false')}
                      >
                        غیرفعال
                      </Button>
                    </ButtonGroup>
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
                  <Button
                    variant="outlined"
                    onClick={() => {
                      reset();
                      setCities([]);
                      if (paginationModel.page === 0) {
                        fetchData();
                        return;
                      }
                      setPaginationModel((p) => ({ ...p, page: 0 }));
                    }}
                  >
                    پاک کردن
                  </Button>

                  <LoadingButton type="submit" variant="contained" color="success">
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
            لیست شعب
          </Typography>

          <DataGrid
            rows={rows}
            columns={columns}
            rowCount={rowCount}
            loading={loading}
            pagination
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50, 100]}
            autoHeight
          />
        </CardContent>
      </Card>

      <Dialog open={deleteDialog.open} onClose={closeDeleteDialog}>
        <DialogTitle>حذف</DialogTitle>
        <DialogContent>
          <DialogContentText>آیا مطمئن هستید؟</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>انصراف</Button>
          <Button color="error" onClick={confirmDelete} disabled={deleteLoading}>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BranchSearch;
