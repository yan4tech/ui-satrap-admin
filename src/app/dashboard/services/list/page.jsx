'use client';

import React, { useMemo, useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

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
    financialCode: '252142544',
    firstName: 'علیرضا',
    lastName: 'علی',
    requestType: 'خدمت شماره یک',
    requestStatus: 'در انتظار تایید مرحله اطلاعات اولیه',
    nationalId: '1234567890',
  },
  {
    id: 2,
    financialCode: '5644545455',
    firstName: 'حمدی',
    lastName: 'محمد',
    requestType: 'خدمت شماره سه',
    requestStatus: 'تایید شده مرحله اطلاعات اولیه',
    nationalId: '2234567890',
  },
  {
    id: 3,
    financialCode: '5454212555',
    firstName: 'اسماعیل',
    lastName: 'رضا',
    requestType: 'خدمت شماره دو',
    requestStatus: 'در انتظار تایید مرحله نقشه برداری',
    nationalId: '3234567890',
  },
  {
    id: 4,
    financialCode: '6562102122',
    firstName: 'ویزدانه',
    lastName: 'محمدرضا',
    requestType: 'خدمت شماره سه',
    requestStatus: 'تایید شده مرحله نقشه برداری',
    nationalId: '4234567890',
  },
];

const defaultFilters = {
  nationalId: '',
  firstName: '',
  lastName: '',
  requestType: '',
  requestStatus: '',
  province: '',
  county: '',
  cityOrVillage: '',
  branch: '',
  fromDate: '',
  toDate: '',
};

function getStatusColor(status) {
  if (status.includes('در انتظار')) return 'warning';
  return 'success';
}

export default function ServicesListPage() {
  const router = useRouter();
  const [filters, setFilters] = useState(defaultFilters);
  const [submittedFilters, setSubmittedFilters] = useState(defaultFilters);

  const rows = useMemo(() => {
    return MOCK_ROWS.filter((row) => {
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
      if (submittedFilters.requestType && row.requestType !== submittedFilters.requestType) return false;
      if (submittedFilters.requestStatus && row.requestStatus !== submittedFilters.requestStatus) return false;
      return true;
    });
  }, [submittedFilters]);

  const handleFilterChange = (key) => (event) => {
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSearch = () => {
    setSubmittedFilters(filters);
  };

  const handleViewDetails = () => {
    router.push(paths.dashboard.services.one);
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            فرم جستجو
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="شماره ملی"
                value={filters.nationalId}
                onChange={handleFilterChange('nationalId')}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="نام"
                value={filters.firstName}
                onChange={handleFilterChange('firstName')}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="نام خانوادگی"
                value={filters.lastName}
                onChange={handleFilterChange('lastName')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="نوع خدمت"
                value={filters.requestType}
                onChange={handleFilterChange('requestType')}
              >
                {REQUEST_TYPES.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="وضعیت"
                value={filters.requestStatus}
                onChange={handleFilterChange('requestStatus')}
              >
                {REQUEST_STATUS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="انتخاب شعبه"
                value={filters.branch}
                onChange={handleFilterChange('branch')}
              >
                {BRANCHES.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="استان"
                value={filters.province}
                onChange={handleFilterChange('province')}
              >
                {PROVINCES.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="شهرستان"
                value={filters.county}
                onChange={handleFilterChange('county')}
              >
                {CITIES.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="شهر/روستا"
                value={filters.cityOrVillage}
                onChange={handleFilterChange('cityOrVillage')}
              >
                {TOWNS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="از تاریخ"
                placeholder="1405/01/01"
                value={filters.fromDate}
                onChange={handleFilterChange('fromDate')}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="تا تاریخ"
                placeholder="1405/01/30"
                value={filters.toDate}
                onChange={handleFilterChange('toDate')}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" color="success" onClick={handleSearch}>
              جستجو
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            نتیجه جستجو
          </Typography>

          <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>شماره مالی</TableCell>
                  <TableCell>نام</TableCell>
                  <TableCell>نام خانوادگی</TableCell>
                  <TableCell>وضعیت درخواست</TableCell>
                  <TableCell>نوع درخواست</TableCell>
                  <TableCell align="center">اکشن</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.financialCode}</TableCell>
                    <TableCell>{row.firstName}</TableCell>
                    <TableCell>{row.lastName}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.requestStatus}
                        size="small"
                        color={getStatusColor(row.requestStatus)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{row.requestType}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="دیدن جزییات">
                        <IconButton color="primary" onClick={handleViewDetails}>
                          <Icon icon="solar:eye-bold" width={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      موردی یافت نشد.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  );
}
