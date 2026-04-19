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
  Grid,
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
  Paper,
  Stack,
  Divider,
} from '@mui/material';

import { LoadingButton } from '@mui/lab';
import { DataGrid } from '@mui/x-data-grid';
import { Icon } from '@iconify/react';

import { Form, Field } from 'src/components/hook-form';
import { paths } from 'src/routes/paths';

// DATE PICKER (JALALI)
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import dayjs from 'dayjs';
import jalaliday from 'jalaliday';

dayjs.extend(jalaliday);
dayjs.calendar('jalali');

// ---------------------- SCHEMA ----------------------
const SearchSchema = zod.object({
  title: zod.string().optional(),
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

  // mock cities
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

  // mock API
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

  // FORM
  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: {
      title: '',
      province: undefined,
      city: undefined,
      is_active: '',
      from_date: null,
      to_date: null,
    },
  });

  const { handleSubmit, watch, setValue, getValues, reset } = methods;

  const selectedProvince = watch('province');
  const isActiveValue = watch('is_active');

  // sync cities
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

  // fetch data
  const fetchData = useCallback(async () => {
    const filters = getValues();

    const res = await searchBranches(filters, paginationModel.page, paginationModel.pageSize);

    setRows(res.data);
    setRowCount(res.total);
  }, [paginationModel, getValues]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // submit
  const onSubmit = handleSubmit(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
    fetchData();
  });

  // actions
  const handleEdit = (row) => router.push(paths.dashboard.branch.edit(row.id));
  const handleDetails = (row) => router.push(paths.dashboard.branch.details(row.id));

  const openDeleteDialog = (row) => setDeleteDialog({ open: true, row });
  const closeDeleteDialog = () => setDeleteDialog({ open: false, row: null });

  const confirmDelete = () => {
    setRows((p) => p.filter((r) => r.id !== deleteDialog.row.id));
    setRowCount((p) => p - 1);
    closeDeleteDialog();
  };

  // columns
  const columns = [
    { field: 'title', headerName: 'عنوان', flex: 1 },
    { field: 'province', headerName: 'استان', flex: 1 },
    { field: 'city', headerName: 'شهر', flex: 1 },
    { field: 'phone', headerName: 'تلفن', flex: 1 },
    {
      field: 'is_active',
      headerName: 'وضعیت',
      renderCell: (p) => (p.value ? 'فعال' : 'غیرفعال'),
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
      <Paper sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Form methods={methods} onSubmit={onSubmit}>
          <Stack spacing={2}>
            <Typography variant="h6">فیلتر جستجوی شعب</Typography>
            <Divider />

            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Field.Text name="title" label="عنوان شعبه" />
              </Grid>

              <Grid item xs={12} md={3}>
                <Field.Select name="province" label="استان" placeholder="انتخاب استان">
                  {provinces.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>

              <Grid item xs={12} md={3}>
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
              </Grid>
            </Grid>

            {/* DATE */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={2}>
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
            </LocalizationProvider>

            {/* STATUS (FIXED) */}
            <Grid container>
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Box>
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
              </Grid>
            </Grid>

            {/* ACTIONS */}
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button
                onClick={() => {
                  reset();
                  setCities([]);
                }}
              >
                پاک کردن
              </Button>

              <LoadingButton type="submit" variant="contained">
                جستجو
              </LoadingButton>
            </Stack>
          </Stack>
        </Form>
      </Paper>

      {/* TABLE */}
      <Card>
        <CardContent>
          <Typography variant="h5">لیست شعب</Typography>

          <Box sx={{ height: 420 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              rowCount={rowCount}
              paginationMode="server"
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
            />
          </Box>
        </CardContent>
      </Card>

      {/* DELETE DIALOG */}
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
