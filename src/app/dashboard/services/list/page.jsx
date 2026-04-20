'use client';

import React, { useMemo, useState } from 'react';
import { z as zod } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Typography,
  Tooltip,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { DataGrid } from '@mui/x-data-grid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import jalaliday from 'jalaliday';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { Field, Form } from 'src/components/hook-form';

dayjs.extend(jalaliday);
dayjs.calendar('jalali');

const REQUEST_TYPES = ['خدمت شماره یک', 'خدمت شماره دو', 'خدمت شماره سه'];
const REQUEST_STATUS = [
  'در انتظار تایید مرحله اطلاعات اولیه',
  'در انتظار تایید مرحله نقشه برداری',
  'تایید شده مرحله اطلاعات اولیه',
  'تایید شده مرحله نقشه برداری',
];
const BRANCHES = ['شعبه 1', 'شعبه 2', 'شعبه 3'];
const PROVINCES = ['تهران', 'اصفهان', 'شیراز'];
const CITIES = ['تهران', 'اسلامشهر', 'پردیس'];
const TOWNS = ['روستا 1', 'روستا 2'];

const MOCK_ROWS = [
  {
    id: 1,
    requestNumber: '252142544',
    firstName: 'علیرضا',
    lastName: 'علی',
    requestType: 'خدمت شماره یک',
    requestStatus: 'در انتظار تایید مرحله اطلاعات اولیه',
    nationalId: '1234567890',
  },
  {
    id: 2,
    requestNumber: '5644545455',
    firstName: 'حمدی',
    lastName: 'محمد',
    requestType: 'خدمت شماره سه',
    requestStatus: 'تایید شده مرحله اطلاعات اولیه',
    nationalId: '2234567890',
  },
  {
    id: 3,
    requestNumber: '5454212555',
    firstName: 'اسماعیل',
    lastName: 'رضا',
    requestType: 'خدمت شماره دو',
    requestStatus: 'در انتظار تایید مرحله نقشه برداری',
    nationalId: '3234567890',
  },
  {
    id: 4,
    requestNumber: '6562102122',
    firstName: 'ویزدانه',
    lastName: 'محمدرضا',
    requestType: 'خدمت شماره سه',
    requestStatus: 'تایید شده مرحله نقشه برداری',
    nationalId: '4234567890',
  },
  ...Array.from({ length: 20 }).map((_, index) => {
    const id = index + 5;
    const statuses = [
      'در انتظار تایید مرحله اطلاعات اولیه',
      'در انتظار تایید مرحله نقشه برداری',
      'تایید شده مرحله اطلاعات اولیه',
      'تایید شده مرحله نقشه برداری',
    ];
    const requestTypes = ['خدمت شماره یک', 'خدمت شماره دو', 'خدمت شماره سه'];

    return {
      id,
      requestNumber: `70000${id}${id + 11}`,
      firstName: `نام ${id}`,
      lastName: `خانوادگی ${id}`,
      requestType: requestTypes[index % requestTypes.length],
      requestStatus: statuses[index % statuses.length],
      nationalId: `99${String(id).padStart(8, '0')}`,
    };
  }),
];

const defaultFilters = {
  requestNumber: '',
  nationalId: '',
  firstName: '',
  lastName: '',
  requestType: '',
  requestStatus: '',
  province: '',
  county: '',
  cityOrVillage: '',
  branch: '',
  fromDate: null,
  toDate: null,
};

const SearchSchema = zod
  .object({
    requestNumber: zod.string().optional(),
    nationalId: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
    requestType: zod.string().optional(),
    requestStatus: zod.string().optional(),
    province: zod.string().optional(),
    county: zod.string().optional(),
    cityOrVillage: zod.string().optional(),
    branch: zod.string().optional(),
    fromDate: zod.any().nullable().optional(),
    toDate: zod.any().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.fromDate &&
      value.toDate &&
      dayjs(value.fromDate).isAfter(dayjs(value.toDate), 'day')
    ) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ['toDate'],
        message: 'تاریخ پایان باید بزرگتر یا مساوی تاریخ شروع باشد.',
      });
    }
  });

function getStatusColor(status) {
  if (status.includes('در انتظار')) return 'warning';
  return 'success';
}

export default function ServicesListPage() {
  const router = useRouter();
  const [submittedFilters, setSubmittedFilters] = useState(defaultFilters);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: defaultFilters,
  });

  const { handleSubmit, getValues, reset } = methods;

  const filteredRows = useMemo(() => {
    return MOCK_ROWS.filter((row) => {
      if (
        submittedFilters.requestNumber &&
        !row.requestNumber.toLowerCase().includes(submittedFilters.requestNumber.toLowerCase())
      ) {
        return false;
      }
      if (
        submittedFilters.nationalId &&
        !row.nationalId.toLowerCase().includes(submittedFilters.nationalId.toLowerCase())
      ) {
        return false;
      }
      if (
        submittedFilters.firstName &&
        !row.firstName.toLowerCase().includes(submittedFilters.firstName.toLowerCase())
      ) {
        return false;
      }
      if (
        submittedFilters.lastName &&
        !row.lastName.toLowerCase().includes(submittedFilters.lastName.toLowerCase())
      ) {
        return false;
      }
      if (submittedFilters.requestType && row.requestType !== submittedFilters.requestType)
        return false;
      if (submittedFilters.requestStatus && row.requestStatus !== submittedFilters.requestStatus)
        return false;
      if (
        submittedFilters.fromDate &&
        dayjs(
          row.id === 1
            ? '2026-01-10'
            : row.id === 2
              ? '2026-01-12'
              : row.id === 3
                ? '2026-01-14'
                : '2026-01-15'
        ).isBefore(dayjs(submittedFilters.fromDate), 'day')
      ) {
        return false;
      }
      if (
        submittedFilters.toDate &&
        dayjs(
          row.id === 1
            ? '2026-01-10'
            : row.id === 2
              ? '2026-01-12'
              : row.id === 3
                ? '2026-01-14'
                : '2026-01-15'
        ).isAfter(dayjs(submittedFilters.toDate), 'day')
      ) {
        return false;
      }
      return true;
    });
  }, [submittedFilters]);

  const rows = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    const end = start + paginationModel.pageSize;
    return filteredRows.slice(start, end);
  }, [filteredRows, paginationModel]);

  const handleSearch = handleSubmit(() => {
    setSubmittedFilters(getValues());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  });

  const handleResetFilters = () => {
    reset(defaultFilters);
    setSubmittedFilters(defaultFilters);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleViewDetails = (row) => {
    // فعلا جزئیات به فرم خدمت شماره یک هدایت می‌شود.
    console.log('view details for request', row.requestNumber);
    router.push(paths.dashboard.services.one);
  };

  const columns = [
    { field: 'requestNumber', headerName: 'شماره درخواست', flex: 1 },
    { field: 'firstName', headerName: 'نام', flex: 1 },
    { field: 'lastName', headerName: 'نام خانوادگی', flex: 1 },
    {
      field: 'requestStatus',
      headerName: 'وضعیت درخواست',
      flex: 1.4,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={getStatusColor(params.value)}
          variant="outlined"
        />
      ),
    },
    { field: 'requestType', headerName: 'نوع درخواست', flex: 1 },
    {
      field: 'actions',
      headerName: 'اکشن',
      align: 'center',
      headerAlign: 'center',
      flex: 0.6,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="دیدن جزییات">
          <IconButton color="primary" onClick={() => handleViewDetails(params.row)}>
            <Icon icon="solar:eye-bold" width={18} />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            فرم جستجو
          </Typography>

          <Form methods={methods} onSubmit={handleSearch}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Field.Text name="requestNumber" label="شماره درخواست" />
              </Grid>
              <Grid item xs={12} md={4}>
                <Field.Text name="nationalId" label="شماره ملی" />
              </Grid>
              <Grid item xs={12} md={4}>
                <Field.Text name="firstName" label="نام" />
              </Grid>
              <Grid item xs={12} md={4}>
                <Field.Text name="lastName" label="نام خانوادگی" />
              </Grid>

              <Box sx={{ width: { xs: '100%', md: '25%' } }}>
                <Field.Select name="requestType" label="نوع خدمت">
                  {REQUEST_TYPES.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Box>
              <Box sx={{ width: { xs: '100%', md: '25%' } }}>
                <Field.Select name="requestStatus" label="وضعیت">
                  {REQUEST_STATUS.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Box>
              <Box sx={{ width: { xs: '100%', md: '25%' } }}>
                <Field.Select name="branch" label="انتخاب شعبه">
                  {BRANCHES.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Box>

              <Box sx={{ width: { xs: '100%', md: '25%' } }}>
                <Field.Select name="province" label="استان">
                  {PROVINCES.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Box>
              <Box sx={{ width: { xs: '100%', md: '25%' } }}>
                <Field.Select name="county" label="شهرستان">
                  {CITIES.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Box>
              <Box sx={{ width: { xs: '100%', md: '25%' } }}>
                <Field.Select name="cityOrVillage" label="شهر/روستا">
                  {TOWNS.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Box>

            </Grid>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={3}>
                  <Controller
                    name="fromDate"
                    control={methods.control}
                    render={({ field, fieldState: { error } }) => (
                      <DatePicker
                        label="از تاریخ"
                        value={field.value}
                        onChange={field.onChange}
                        format="YYYY/MM/DD"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!error,
                            helperText: error?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Controller
                    name="toDate"
                    control={methods.control}
                    render={({ field, fieldState: { error } }) => (
                      <DatePicker
                        label="تا تاریخ"
                        value={field.value}
                        onChange={field.onChange}
                        format="YYYY/MM/DD"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!error,
                            helperText: error?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>

            <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button type="button" variant="outlined" onClick={handleResetFilters}>
                پاک کردن
              </Button>
              <Button type="submit" variant="contained" color="success">
                جستجو
              </Button>
            </Box>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            نتیجه جستجو
          </Typography>

          <DataGrid
            rows={rows}
            columns={columns}
            rowCount={filteredRows.length}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20]}
            autoHeight
            disableRowSelectionOnClick
          />
        </CardContent>
      </Card>
    </Stack>
  );
}
