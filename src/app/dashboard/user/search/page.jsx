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
  searchUsers,
  deleteUserById,
  fetchRolesOptions,
  fetchBranchesOptions,
  USER_TYPE_OPTIONS,
} from '../user-api';

const SearchSchema = zod.object({
  name: zod.string().optional(),
  family: zod.string().optional(),
  email: zod.string().optional(),
  mobile: zod.string().optional(),
  role_id: zod.union([zod.string(), zod.number()]).optional(),
  branch_id: zod.union([zod.string(), zod.number()]).optional(),
  user_type: zod.string().optional(),
  active: zod.string().optional(),
  verified: zod.string().optional(),
});

function userTypeLabel(v) {
  return USER_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? String(v);
}

export default function UserSearchPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: {
      name: '',
      family: '',
      email: '',
      mobile: '',
      role_id: '',
      branch_id: '',
      user_type: USER_TYPE_OPTIONS[0]?.value ?? 'mobile',
      active: '',
      verified: '',
    },
  });

  const { handleSubmit, watch, setValue, getValues, reset } = methods;
  const activeVal = watch('active');
  const verifiedVal = watch('verified');
  const selectedUserType = watch('user_type');

  useEffect(() => {
    if (selectedUserType !== 'branch') {
      setValue('branch_id', '');
    }
  }, [selectedUserType, setValue]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const f = getValues();
    const filters = { ...f };
    try {
      const res = await searchUsers(filters, paginationModel.page, paginationModel.pageSize);
      setRows(
        res.data.map((u) => ({
        id: u.id ?? u.ID,
        ...u,
        role_title: roles.find((r) => r.id === Number(u.role_id))?.title || '—',
        branch_title: branches.find((b) => b.id === Number(u.branch_id))?.title || '—',
        user_type_label: userTypeLabel(u.user_type),
        }))
      );
      setRowCount(res.total);
    } catch {
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [paginationModel, getValues, roles, branches]);

  useEffect(() => {
    (async () => {
      try {
        const [roleRows, branchRows] = await Promise.all([fetchRolesOptions(), fetchBranchesOptions()]);
        setRoles(roleRows);
        setBranches(branchRows);
      } catch {
        setRoles([]);
        setBranches([]);
      }
    })();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = handleSubmit(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
    fetchData();
  });

  const columns = [
    { field: 'mobile', headerName: 'موبایل', width: 130 },
    {
      field: 'name',
      headerName: 'نام',
      flex: 1,
      renderCell: (params) => `${params.row.name || ''} ${params.row.family || ''}`,
    },
    { field: 'email', headerName: 'ایمیل', flex: 1 },
    {
      field: 'role_title',
      headerName: 'نقش',
      flex: 1,
      renderCell: (p) => <Chip size="small" label={p.value || '—'} color="primary" variant="outlined" />,
    },
    { field: 'user_type_label', headerName: 'نوع کاربر', width: 120 },
    { field: 'branch_title', headerName: 'شعبه', flex: 1 },
    {
      field: 'active',
      headerName: 'وضعیت',
      width: 95,
      renderCell: (p) => (
        <Chip size="small" label={p.value ? 'فعال' : 'غیرفعال'} color={p.value ? 'success' : 'error'} />
      ),
    },
    {
      field: 'verified',
      headerName: 'تایید شده',
      width: 95,
      renderCell: (p) => (
        <Chip size="small" label={p.value ? 'بله' : 'خیر'} color={p.value ? 'success' : 'error'} />
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
            <IconButton onClick={() => router.push(paths.dashboard.user.edit(params.row.id))}>
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
    if (deleteDialog.row) {
      deleteUserById(deleteDialog.row.id)
        .then(() => {
          setDeleteDialog({ open: false, row: null });
          fetchData();
        })
        .catch(() => {
          setDeleteDialog({ open: false, row: null });
        });
    }
  };

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<Icon icon="mdi:plus" width="20" />}
          onClick={() => router.push(paths.dashboard.user.create)}
        >
          کاربر جدید
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
            <Typography variant="h6">فیلتر کاربران</Typography>
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
                    <Field.Text name="name" label="نام / نام خانوادگی" />
                  </Box>
                  <Box>
                    <Field.Text name="family" label="نام خانوادگی" />
                  </Box>
                  <Box>
                    <Field.Text name="email" label="ایمیل" />
                  </Box>
                  <Box>
                    <Field.Text name="mobile" label="موبایل" />
                  </Box>
                  <Box>
                    <Field.Select name="role_id" label="نقش" placeholder="همه">
                      <MenuItem value="">همه</MenuItem>
                      {roles.map((r) => (
                        <MenuItem key={r.id} value={String(r.id)}>
                          {r.title}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Box>
                  <Box>
                    <Field.Select name="user_type" label="نوع کاربر" placeholder="همه">
                      {USER_TYPE_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Box>
                  {selectedUserType === 'branch' && (
                    <Box>
                      <Field.Select name="branch_id" label="شعبه" placeholder="همه">
                        <MenuItem value="">همه</MenuItem>
                        {branches.map((b) => (
                          <MenuItem key={b.id} value={String(b.id)}>
                            {b.title}
                          </MenuItem>
                        ))}
                      </Field.Select>
                    </Box>
                  )}
                </Box>

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
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      وضعیت
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant={activeVal === '' ? 'contained' : 'outlined'}
                        onClick={() => setValue('active', '')}
                      >
                        همه
                      </Button>
                      <Button
                        size="small"
                        variant={activeVal === 'true' ? 'contained' : 'outlined'}
                        color="success"
                        onClick={() => setValue('active', 'true')}
                      >
                        فعال
                      </Button>
                      <Button
                        size="small"
                        variant={activeVal === 'false' ? 'contained' : 'outlined'}
                        color="error"
                        onClick={() => setValue('active', 'false')}
                      >
                        غیرفعال
                      </Button>
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      تأیید شده
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant={verifiedVal === '' ? 'contained' : 'outlined'}
                        onClick={() => setValue('verified', '')}
                      >
                        همه
                      </Button>
                      <Button
                        size="small"
                        variant={verifiedVal === 'true' ? 'contained' : 'outlined'}
                        color="success"
                        onClick={() => setValue('verified', 'true')}
                      >
                        بله
                      </Button>
                      <Button
                        size="small"
                        variant={verifiedVal === 'false' ? 'contained' : 'outlined'}
                        color="error"
                        onClick={() => setValue('verified', 'false')}
                      >
                        خیر
                      </Button>
                    </Stack>
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
            لیست کاربران
          </Typography>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(r) => r.id ?? r.ID}
            rowCount={rowCount}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            autoHeight
          />
        </CardContent>
      </Card>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, row: null })}>
        <DialogTitle>حذف کاربر</DialogTitle>
        <DialogContent>
          <DialogContentText>این کاربر حذف شود؟</DialogContentText>
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
