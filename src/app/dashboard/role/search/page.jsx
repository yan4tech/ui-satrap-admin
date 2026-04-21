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
  searchRoles,
  deleteRole,
  permissionTitlesByIds,
} from 'src/app/dashboard/_lib/access-control-mock';

const SearchSchema = zod.object({
  title: zod.string().optional(),
  active: zod.string().optional(),
});

export default function RoleSearchPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [isSearchOpen, setIsSearchOpen] = useState(true);

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: { title: '', active: '' },
  });

  const { handleSubmit, watch, setValue, getValues, reset } = methods;
  const isActiveValue = watch('active');

  const fetchData = useCallback(async () => {
    const filters = getValues();
    const res = searchRoles(filters, paginationModel.page, paginationModel.pageSize);
    setRows(
      res.data.map((r) => ({
        ...r,
        permission_labels: permissionTitlesByIds(r.permission_ids || []),
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
    { field: 'title', headerName: 'عنوان', flex: 1 },
    { field: 'slug', headerName: 'اسلاگ', flex: 1 },
    {
      field: 'permission_labels',
      headerName: 'دسترسی‌ها',
      flex: 1.5,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ py: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {(params.value || []).slice(0, 4).map((t) => (
            <Chip key={t} label={t} size="small" variant="outlined" />
          ))}
          {(params.value || []).length > 4 && (
            <Chip size="small" label={`+${params.value.length - 4}`} />
          )}
        </Box>
      ),
    },
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
            <IconButton onClick={() => router.push(paths.dashboard.role.details(params.row.id))}>
              <Icon icon="mdi:eye-outline" width="20" />
            </IconButton>
          </Tooltip>
          <Tooltip title="ویرایش">
            <IconButton onClick={() => router.push(paths.dashboard.role.edit(params.row.id))}>
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
      deleteRole(deleteDialog.row.id);
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
            <Typography variant="h6">فیلتر نقش‌ها</Typography>
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
                    <Field.Text name="title" label="عنوان / اسلاگ / توضیح" />
                  </Box>
                  <Box>
                    <Box sx={{ pt: 1 }}>
                      <Typography sx={{ mb: 1 }} variant="body2">
                        وضعیت
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
                          variant={isActiveValue === 'false' ? 'contained' : 'outlined'}
                          onClick={() => setValue('active', 'false')}
                        >
                          غیرفعال
                        </Button>
                      </Stack>
                    </Box>
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
            لیست نقش‌ها
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
        <DialogTitle>حذف نقش</DialogTitle>
        <DialogContent>
          <DialogContentText>
            نقش حذف شود؟ کاربرانی که این نقش را دارند بدون نقش می‌مانند تا نقش جدید بگیرند.
          </DialogContentText>
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
