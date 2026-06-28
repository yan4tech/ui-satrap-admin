'use client';

import { z as zod } from 'zod';
import { Icon } from '@iconify/react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Card,
  Chip,
  Stack,
  Alert,
  Button,
  Dialog,
  Tooltip,
  Collapse,
  MenuItem,
  Snackbar,
  Typography,
  IconButton,
  CardContent,
  ButtonGroup,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axios from 'src/lib/axios';
import { deleteBranch } from 'src/lib/branch-api';
import { extractMembershipErrorMessage } from 'src/lib/membership-errors';
import {
  fetchProvinces,
  buildRegistrationUnitNameMap,
  fetchRegistrationUnitsByProvince,
} from 'src/lib/location-api';

import { Form, Field } from 'src/components/hook-form';

// ---------------------- SCHEMA ----------------------
const SearchSchema = zod.object({
  branch_number: zod.string().optional(),
  title: zod.string().optional(),
  phone: zod.string().optional(),
  ip: zod.string().optional(),
  province: zod.number().optional(),
  registration_unit: zod.number().optional(),
  is_active: zod.string().optional(),
  from_date: zod.any().optional(),
  to_date: zod.any().optional(),
});

const BranchSearch = () => {
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [registrationUnits, setRegistrationUnits] = useState([]);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: {
      branch_number: '',
      title: '',
      phone: '',
      ip: '',
      province: undefined,
      registration_unit: undefined,
      is_active: '',
      from_date: null,
      to_date: null,
    },
  });

  const { handleSubmit, watch, setValue, getValues, reset } = methods;

  const selectedProvince = watch('province');
  const isActiveValue = watch('is_active');

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchProvinces();
        setProvinces(list);
      } catch {
        setProvinces([]);
      }
    })();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!selectedProvince) {
        setRegistrationUnits([]);
        setValue('registration_unit', undefined);
        return;
      }

      try {
        const list = await fetchRegistrationUnitsByProvince(selectedProvince);
        setRegistrationUnits(list);
        setValue('registration_unit', undefined);
      } catch {
        setRegistrationUnits([]);
        setValue('registration_unit', undefined);
      }
    };

    load();
  }, [selectedProvince, setValue]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = getValues();
      const res = await axios.get('/api/membership/branch', {
        params: {
          limit: paginationModel.pageSize,
          offset: paginationModel.page * paginationModel.pageSize,
          ...(filters.branch_number ? { branch_number: filters.branch_number } : {}),
          ...(filters.title ? { title: filters.title } : {}),
          ...(filters.phone ? { phone: filters.phone } : {}),
          ...(filters.ip ? { ip: filters.ip } : {}),
          ...(filters.province ? { province_id: filters.province } : {}),
          ...(filters.registration_unit
            ? { registration_unit_id: filters.registration_unit }
            : {}),
          ...(filters.is_active !== '' ? { is_active: filters.is_active } : {}),
        },
      });

      const payload = res?.data ?? {};
      const data = Array.isArray(payload?.data) ? payload.data : [];
      const provinceIds = data.map((item) => Number(item.province ?? item.province_id ?? 0));
      const unitNames = await buildRegistrationUnitNameMap(provinceIds);
      const provinceNames = Object.fromEntries(provinces.map((p) => [p.id, p.name]));

      const mapped = data.map((item) => {
        const provinceId = Number(item.province ?? item.province_id ?? 0);
        const unitId = Number(
          item.registration_unit ?? item.registration_unit_id ?? item.city ?? 0
        );

        return {
          id: item.ID ?? item.id,
          title: item.title || '-',
          province: provinceNames[provinceId] || (provinceId > 0 ? String(provinceId) : '-'),
          registration_unit:
            unitNames[unitId] || (unitId > 0 ? String(unitId) : '-'),
          ip: item.ip || '-',
          phone: item.phone || '-',
          is_active: Boolean(item.is_active),
          max_users: item.max_users ?? 0,
          active_users: Array.isArray(item.users)
            ? item.users.filter((u) => u?.active).length
            : '—',
        };
      });

      setRows(mapped);
      setRowCount(Number(payload?.total ?? payload?.count ?? mapped.length));
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [paginationModel, getValues, provinces]);

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

  const closeDeleteDialog = () => setDeleteDialog({ open: false, row: null });

  const confirmDelete = async () => {
    if (!deleteDialog.row?.id) return;
    setDeleting(true);
    try {
      await deleteBranch(deleteDialog.row.id);
      closeDeleteDialog();
      setSnackbar({ open: true, message: 'شعبه با موفقیت حذف شد', severity: 'success' });
      fetchData();
    } catch (err) {
      setSnackbar({
        open: true,
        message: extractMembershipErrorMessage(err, 'خطا در حذف شعبه'),
        severity: 'error',
      });
      closeDeleteDialog();
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { field: 'id', headerName: 'شناسه', flex: 0.7 },
    { field: 'title', headerName: 'عنوان', flex: 1 },
    { field: 'province', headerName: 'استان', flex: 1 },
    { field: 'registration_unit', headerName: 'واحد ثبتی', flex: 1.2 },
    { field: 'ip', headerName: 'IP', flex: 1 },
    { field: 'phone', headerName: 'تلفن', flex: 1 },
    { field: 'max_users', headerName: 'سقف کاربر', flex: 0.8 },
    { field: 'active_users', headerName: 'کاربر فعال', flex: 0.8 },
    {
      field: 'is_active',
      headerName: 'وضعیت',
      flex: 1,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value ? 'فعال' : 'غیرفعال'}
          color={params.value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'عملیات',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="ویرایش">
            <IconButton size="small" onClick={() => handleEdit(params.row)}>
              <Icon icon="solar:pen-bold" />
            </IconButton>
          </Tooltip>
          <Tooltip title="حذف">
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteDialog({ open: true, row: params.row })}
            >
              <Icon icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">جستجوی شعب</Typography>

            <Button variant="outlined" onClick={() => setIsSearchOpen((v) => !v)}>
              {isSearchOpen ? 'بستن فیلترها' : 'نمایش فیلترها'}
            </Button>
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
                      name="registration_unit"
                      label="واحد ثبتی"
                      disabled={!selectedProvince}
                      placeholder="انتخاب واحد ثبتی"
                    >
                      {registrationUnits.map((u) => (
                        <MenuItem key={u.id} value={u.id}>
                          {u.name}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Box>

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
                      setRegistrationUnits([]);
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="h5">لیست شعب</Typography>
            <Tooltip title="نمای درختی شعب">
              <IconButton
                color="primary"
                onClick={() => router.push(paths.dashboard.branch.tree)}
                aria-label="نمای درختی شعب"
              >
                <Icon icon="mdi:file-tree" width={24} />
              </IconButton>
            </Tooltip>
          </Box>

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
        <DialogTitle>حذف شعبه</DialogTitle>
        <DialogContent>
          <DialogContentText>
            آیا از حذف شعبه «{deleteDialog.row?.title || ''}» (شناسه {deleteDialog.row?.id}) اطمینان
            دارید؟ این عمل قابل بازگشت نیست.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={deleting}>
            انصراف
          </Button>
          <LoadingButton color="error" variant="contained" loading={deleting} onClick={confirmDelete}>
            حذف
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BranchSearch;
