'use client';

import { z as zod } from 'zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  deleteUser,
  listRoles,
  roleTitleById,
  branchTitleById,
  USER_TYPE_OPTIONS,
} from 'src/app/dashboard/_lib/access-control-mock';

const SearchSchema = zod.object({
  name: zod.string().optional(),
  mobile: zod.string().optional(),
  role_id: zod.union([zod.string(), zod.number()]).optional(),
  user_type: zod.union([zod.string(), zod.number()]).optional(),
  active: zod.string().optional(),
  verified: zod.string().optional(),
});

function userTypeLabel(v) {
  return USER_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? String(v);
}

export default function UserSearchPage() {
  const router = useRouter();
  const roles = useMemo(() => listRoles(), []);
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [isSearchOpen, setIsSearchOpen] = useState(true);

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: {
      name: '',
      mobile: '',
      role_id: '',
      user_type: '',
      active: '',
      verified: '',
    },
  });

  const { handleSubmit, watch, setValue, getValues, reset } = methods;
  const activeVal = watch('active');
  const verifiedVal = watch('verified');

  const fetchData = useCallback(async () => {
    const f = getValues();
    const filters = { ...f };
    const res = searchUsers(filters, paginationModel.page, paginationModel.pageSize);
    setRows(
      res.data.map((u) => ({
        ...u,
        role_title: roleTitleById(u.role_id),
        branch_title: branchTitleById(u.branch_id),
        user_type_label: userTypeLabel(u.user_type),
      }))
    );
    setRowCount(res.total);
  }, [paginationModel, getValues]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = handleSubmit(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
    fetchData();
  });

  const columns = [
    {
      field: 'name',
      headerName: 'نام',
      flex: 1,
      renderCell: (params) => `${params.row.name} ${params.row.family}`,
    },
    { field: 'mobile', headerName: 'موبایل', width: 130 },
    { field: 'role_title', headerName: 'نقش', flex: 1 },
    { field: 'branch_title', headerName: 'شعبه', flex: 1 },
    { field: 'user_type_label', headerName: 'نوع کاربر', width: 120 },
    {
      field: 'active',
      headerName: 'فعال',
      width: 80,
      renderCell: (p) => (
        <Chip size="small" label={p.value ? 'بله' : 'خیر'} color={p.value ? 'success' : 'default'} />
      ),
    },
    {
      field: 'verified',
      headerName: 'تأیید',
      width: 80,
      renderCell: (p) => (
        <Chip size="small" label={p.value ? 'بله' : 'خیر'} color={p.value ? 'info' : 'default'} />
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
            <IconButton onClick={() => router.push(paths.dashboard.user.details(params.row.id))}>
              <Icon icon="mdi:eye-outline" width="20" />
            </IconButton>
          </Tooltip>
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
      deleteUser(deleteDialog.row.id);
      setDeleteDialog({ open: false, row: null });
      fetchData();
    }
  };

  return (
    <>
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
                      <MenuItem value="">همه</MenuItem>
                      {USER_TYPE_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={String(o.value)}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Box>
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
                      فعال
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
                        onClick={() => setValue('active', 'true')}
                      >
                        فعال
                      </Button>
                      <Button
                        size="small"
                        variant={activeVal === 'false' ? 'contained' : 'outlined'}
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
                        onClick={() => setValue('verified', 'true')}
                      >
                        بله
                      </Button>
                      <Button
                        size="small"
                        variant={verifiedVal === 'false' ? 'contained' : 'outlined'}
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
            getRowId={(r) => r.id}
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
