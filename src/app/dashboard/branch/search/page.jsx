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

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import dayjs from 'dayjs';
import jalaliday from 'jalaliday';

dayjs.extend(jalaliday);
dayjs.calendar('jalali');

// ---------------------- SCHEMA ----------------------
const SearchSchema = zod.object({
  branch_number: zod.string().optional(),
  title: zod.string().optional(),
  province: zod.number().optional(),
  city: zod.number().optional(),
  village: zod.number().optional(),
  is_active: zod.string().optional(),
  from_date: zod.any().optional(),
  to_date: zod.any().optional(),
});

const BranchSearch = () => {
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);

  const [cities, setCities] = useState([]);
  const [villages, setVillages] = useState([]);

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

  const fetchVillagesByCity = async (cityId) => {
    const data = {
      10: [
        { id: 100, name: 'روستای A' },
        { id: 101, name: 'روستای B' },
      ],
      20: [
        { id: 200, name: 'روستای C' },
        { id: 201, name: 'روستای D' },
      ],
    };
    return data[cityId] || [];
  };

  const searchBranches = async (filters, page, pageSize) => {
    const allData = Array.from({ length: 37 }).map((_, i) => ({
      id: i + 1,
      branch_number: `BR-${String(i + 1).padStart(4, '0')}`,
      title: `شعبه ${i + 1}`,
      province: i % 2 === 0 ? 'تهران' : 'اصفهان',
      city: i % 2 === 0 ? 'تهران' : 'کاشان',
      phone: '021123456',
      is_active: i % 2 === 0,
    }));

    const filteredData = allData.filter((item) => {
      if (
        filters.branch_number &&
        !item.branch_number.toLowerCase().includes(filters.branch_number.toLowerCase())
      ) {
        return false;
      }

      if (filters.title && !item.title.toLowerCase().includes(filters.title.toLowerCase())) {
        return false;
      }

      return true;
    });

    const start = page * pageSize;
    const end = start + pageSize;

    return {
      data: filteredData.slice(start, end),
      total: filteredData.length,
    };
  };

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: {
      branch_number: '',
      title: '',
      province: undefined,
      city: undefined,
      village: undefined,
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
        setVillages([]);
        setValue('village', undefined);
        return;
      }

      const res = await fetchCitiesByProvince(selectedProvince);
      setCities(res);
      setValue('city', undefined);

      setVillages([]);
      setValue('village', undefined);
    };

    load();
  }, [selectedProvince, setValue]);

  // city -> village
  useEffect(() => {
    const load = async () => {
      if (!selectedCity) {
        setVillages([]);
        setValue('village', undefined);
        return;
      }

      const res = await fetchVillagesByCity(selectedCity);
      setVillages(res);
      setValue('village', undefined);
    };

    load();
  }, [selectedCity, setValue]);

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
    setPaginationModel((p) => ({ ...p, page: 0 }));
    fetchData();
  });

  const handleEdit = (row) => router.push(paths.dashboard.branch.edit(row.id));
  const handleDetails = (row) => router.push(paths.dashboard.branch.details(row.id));

  const openDeleteDialog = (row) => setDeleteDialog({ open: true, row });
  const closeDeleteDialog = () => setDeleteDialog({ open: false, row: null });

  const confirmDelete = () => {
    setRows((p) => p.filter((r) => r.id !== deleteDialog.row.id));
    setRowCount((p) => p - 1);
    closeDeleteDialog();
  };

  const columns = [
    { field: 'branch_number', headerName: 'شماره شعبه', flex: 1 },
    { field: 'title', headerName: 'عنوان', flex: 1 },
    { field: 'province', headerName: 'استان', flex: 1 },
    { field: 'city', headerName: 'شهر', flex: 1 },
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

                  <Box>
                    <Field.Select
                      name="village"
                      label="روستا"
                      disabled={!selectedCity}
                      placeholder="انتخاب روستا/ده"
                    >
                      {villages.map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.name}
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
                      setVillages([]);
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
          <Typography variant="h5">لیست شعب</Typography>

          <DataGrid
            rows={rows}
            columns={columns}
            rowCount={rowCount}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
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
          <Button color="error" onClick={confirmDelete}>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BranchSearch;
