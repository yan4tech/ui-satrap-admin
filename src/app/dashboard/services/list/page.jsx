'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  NoSsr,
  Stack,
  Typography,
  Tooltip,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { Field, Form } from 'src/components/hook-form';

import { deleteProcessInstance, fetchProcesses } from '../one/engine-api';

const DEFINITION_LABELS = {
  service1: 'خدمت شماره یک',
  service2: 'خدمت شماره دو',
  service3: 'خدمت شماره سه',
};

const DEFINITION_OPTIONS = [
  { value: '', label: 'همه' },
  { value: 'service1', label: DEFINITION_LABELS.service1 },
  { value: 'service2', label: DEFINITION_LABELS.service2 },
  { value: 'service3', label: DEFINITION_LABELS.service3 },
];

const PROCESS_STATUS_OPTIONS = [
  { value: '', label: 'همه' },
  { value: 'RUNNING', label: 'در حال اجرا' },
  { value: 'COMPLETED', label: 'تکمیل‌شده' },
  { value: 'CANCELLED', label: 'لغوشده' },
  { value: 'SUSPENDED', label: 'معلق' },
];

const defaultFilters = {
  processId: '',
  definitionKey: '',
  processStatus: '',
  applicantName: '',
  currentElementId: '',
};

const SearchSchema = zod.object({
  processId: zod.string().optional(),
  definitionKey: zod.string().optional(),
  processStatus: zod.string().optional(),
  applicantName: zod.string().optional(),
  currentElementId: zod.string().optional(),
});

function pickLatestTask(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) return null;
  return [...tasks].sort(
    (a, b) => new Date(b.CreatedAt || 0).getTime() - new Date(a.CreatedAt || 0).getTime(),
  )[0];
}

function mapItemsToRows(items) {
  return (items || []).map((item) => {
    const p = item.process;
    const latest = pickLatestTask(item.tasks);
    const key = p?.definition_key ?? '';
    return {
      id: p.ID,
      processInstanceId: p.ID,
      definitionKey: key,
      serviceLabel: DEFINITION_LABELS[key] || key || '—',
      processStatus: p.status ?? '—',
      applicantName: p.variables?.applicant_name ?? '—',
      startedAt: p.started_at ?? null,
      currentTaskName: latest?.name ?? '—',
      currentElementId: latest?.element_id ?? '—',
      currentTaskStatus: latest?.status ?? '—',
      currentTaskType: latest?.type ?? '—',
    };
  });
}

function processStatusColor(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'RUNNING') return 'info';
  if (s === 'COMPLETED') return 'success';
  if (s === 'CANCELLED') return 'error';
  if (s === 'SUSPENDED') return 'warning';
  return 'default';
}

function taskStatusColor(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'CREATED' || s === 'READY') return 'warning';
  if (s === 'COMPLETED' || s === 'DONE') return 'success';
  return 'default';
}

export default function ServicesListPage() {
  const router = useRouter();
  const [allRows, setAllRows] = useState([]);
  const [submittedFilters, setSubmittedFilters] = useState(defaultFilters);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: defaultFilters,
  });

  const { handleSubmit, getValues, reset } = methods;

  const loadProcesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProcesses();
      setAllRows(mapItemsToRows(data.items));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت لیست فرایندها.');
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProcesses();
  }, [loadProcesses]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (submittedFilters.processId) {
        const q = submittedFilters.processId.trim();
        if (!String(row.processInstanceId).includes(q)) return false;
      }
      if (submittedFilters.definitionKey && row.definitionKey !== submittedFilters.definitionKey) {
        return false;
      }
      if (
        submittedFilters.processStatus &&
        String(row.processStatus).toUpperCase() !==
          String(submittedFilters.processStatus).toUpperCase()
      ) {
        return false;
      }
      if (submittedFilters.applicantName) {
        const q = submittedFilters.applicantName.trim().toLowerCase();
        if (!String(row.applicantName).toLowerCase().includes(q)) return false;
      }
      if (submittedFilters.currentElementId) {
        const q = submittedFilters.currentElementId.trim().toLowerCase();
        if (!String(row.currentElementId).toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allRows, submittedFilters]);

  const handleSearch = handleSubmit(() => {
    setSubmittedFilters(getValues());
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    void loadProcesses();
  });

  const handleResetFilters = () => {
    reset(defaultFilters);
    setSubmittedFilters(defaultFilters);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    void loadProcesses();
  };

  const handleViewDetails = useCallback(
    (row) => {
      const key = row.definitionKey;
      const q = new URLSearchParams();
      q.set('processId', String(row.processInstanceId));
      q.set('definitionKey', String(key || 'service1'));
      const qs = `?${q.toString()}`;

      if (key === 'service3') {
        router.push(`${paths.dashboard.services.three}${qs}`);
        return;
      }
      if (key === 'service2') {
        router.push(`${paths.dashboard.services.two}${qs}`);
        return;
      }
      router.push(`${paths.dashboard.services.one}${qs}`);
    },
    [router],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    setError(null);
    try {
      await deleteProcessInstance(deleteTarget.processInstanceId);
      setDeleteTarget(null);
      await loadProcesses();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حذف فرایند ناموفق بود.');
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteTarget, loadProcesses]);

  const columns = useMemo(
    () => [
    {
      field: 'processInstanceId',
      headerName: 'شماره فرایند',
      flex: 0.9,
      minWidth: 120,
    },
    {
      field: 'serviceLabel',
      headerName: 'نوع خدمت',
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'applicantName',
      headerName: 'نام متقاضی',
      flex: 1,
      minWidth: 110,
    },
    {
      field: 'processStatus',
      headerName: 'وضعیت فرایند',
      flex: 0.85,
      minWidth: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={processStatusColor(params.value)}
          variant="outlined"
        />
      ),
    },
    {
      field: 'startedAt',
      headerName: 'تاریخ شروع',
      flex: 1,
      minWidth: 150,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format('YYYY/MM/DD HH:mm') : '—',
    },
    {
      field: 'currentTaskName',
      headerName: 'مرحله جاری (آخرین تسک)',
      flex: 1.2,
      minWidth: 160,
    },
    {
      field: 'currentElementId',
      headerName: 'شناسه مرحله',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" color="primary" />
      ),
    },
    {
      field: 'currentTaskStatus',
      headerName: 'وضعیت تسک',
      flex: 0.85,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={taskStatusColor(params.value)}
          variant="outlined"
        />
      ),
    },
    {
      field: 'currentTaskType',
      headerName: 'نوع تسک',
      flex: 0.9,
      minWidth: 110,
    },
    {
      field: 'actions',
      headerName: 'عملیات',
      align: 'center',
      headerAlign: 'center',
      flex: 0.7,
      minWidth: 112,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0} alignItems="center" justifyContent="center">
          <Tooltip title="جزییات فرایند">
            <IconButton color="primary" size="small" onClick={() => handleViewDetails(params.row)}>
              <Icon icon="solar:eye-bold" width={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="حذف فرایند">
            <IconButton color="error" size="small" onClick={() => setDeleteTarget(params.row)}>
              <Icon icon="solar:trash-bin-trash-bold" width={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
    ],
    [handleViewDetails, setDeleteTarget],
  );

  return (
    <Stack spacing={3}>
      <Card
        sx={{
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
            <Icon icon="solar:magnifer-linear" width={20} />
            <Typography variant="h6">فرم جستجو</Typography>
          </Box>

          <Collapse in={isSearchOpen}>
            <Form methods={methods} onSubmit={handleSearch}>
              <Grid
                container
                spacing={2}
                sx={{
                  p: { xs: 1, md: 2 },
                  borderRadius: 2,
                  bgcolor: 'background.neutral',
                  border: '1px dashed',
                  borderColor: 'divider',
                }}
              >
                <Grid item xs={12} md={4}>
                  <Field.Text name="processId" label="شماره فرایند" placeholder="مثلاً 1749882971" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Field.Select name="definitionKey" label="نوع خدمت">
                    {DEFINITION_OPTIONS.map((item) => (
                      <MenuItem key={item.value || 'all'} value={item.value}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Field.Select name="processStatus" label="وضعیت فرایند">
                    {PROCESS_STATUS_OPTIONS.map((item) => (
                      <MenuItem key={item.value || 'all'} value={item.value}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Field.Text name="applicantName" label="نام متقاضی" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Field.Text
                    name="currentElementId"
                    label="شناسه مرحله (element)"
                    placeholder="مثلاً payment"
                  />
                </Grid>
              </Grid>

              <Box
                sx={{
                  mt: 2,
                  pt: 2,
                  borderTop: '1px dashed',
                  borderColor: 'divider',
                  display: 'flex',
                  gap: 1,
                  justifyContent: 'flex-end',
                }}
              >
                <Button type="button" variant="outlined" onClick={handleResetFilters}>
                  پاک کردن
                </Button>
                <Button type="submit" variant="contained" color="success">
                  جستجو
                </Button>
              </Box>
            </Form>
          </Collapse>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6">نتیجه جستجو</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Icon icon="solar:refresh-linear" width={18} />}
              onClick={() => void loadProcesses()}
              disabled={loading}
            >
              بروزرسانی
            </Button>
          </Stack>

          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <NoSsr>
              <DataGrid
                rows={filteredRows}
                columns={columns}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 20]}
                autoHeight
                disableRowSelectionOnClick
              />
            </NoSsr>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleteSubmitting && setDeleteTarget(null)}>
        <DialogTitle>حذف فرایند</DialogTitle>
        <DialogContent>
          <DialogContentText>
            آیا مطمئن هستید که می‌خواهید فرایند با شماره{' '}
            <strong>{deleteTarget?.processInstanceId}</strong>
            {deleteTarget?.serviceLabel ? (
              <>
                {' '}
                (<strong>{deleteTarget.serviceLabel}</strong>)
              </>
            ) : null}{' '}
            حذف شود؟ این عمل قابل بازگشت نیست.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteSubmitting}>
            انصراف
          </Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleteSubmitting}>
            {deleteSubmitting ? 'در حال حذف…' : 'حذف'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
