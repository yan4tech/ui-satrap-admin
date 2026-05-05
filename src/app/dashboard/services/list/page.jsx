'use client';

import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { Icon } from '@iconify/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  NoSsr,
  Stack,
  Button,
  Dialog,
  Tooltip,
  Collapse,
  MenuItem,
  IconButton,
  Typography,
  CardContent,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
  DialogContentText,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Form, Field } from 'src/components/hook-form';

import {
  fetchProcesses,
  deleteProcessInstance,
  writeService1TasksSnapshot,
  parseEngineProcessRejectState,
  pickRepresentativeTaskForProcessRow,
} from '../one/engine-api';

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

const PROCESS_STATUS_LABELS = {
  RUNNING: 'در حال اجرا',
  WAITING_CENTRAL: 'در انتظار ستاد',
  WAITING_BRANCH: 'در انتظار شعبه',
  WAITING_EXTERNAL: 'در انتظار سامانه بیرونی',
  LOCKED: 'قفل شده',
  REJECTED: 'رد شده',
  COMPLETED: 'تکمیل شده',
  DONE: 'انجام شده',
  FAILED: 'ناموفق',
  CANCELLED: 'لغوشده',
  SUSPENDED: 'معلق',
};

function getProcessStatusLabel(status) {
  const key = String(status || '').toUpperCase();
  return PROCESS_STATUS_LABELS[key] ?? (status || '—');
}

const PROCESS_STATUS_OPTIONS = [
  { value: '', label: 'همه' },
  { value: 'RUNNING', label: getProcessStatusLabel('RUNNING') },
  { value: 'WAITING_CENTRAL', label: getProcessStatusLabel('WAITING_CENTRAL') },
  { value: 'WAITING_BRANCH', label: getProcessStatusLabel('WAITING_BRANCH') },
  { value: 'WAITING_EXTERNAL', label: getProcessStatusLabel('WAITING_EXTERNAL') },
  { value: 'LOCKED', label: getProcessStatusLabel('LOCKED') },
  { value: 'REJECTED', label: getProcessStatusLabel('REJECTED') },
  { value: 'COMPLETED', label: getProcessStatusLabel('COMPLETED') },
  { value: 'DONE', label: getProcessStatusLabel('DONE') },
  { value: 'FAILED', label: getProcessStatusLabel('FAILED') },
  { value: 'CANCELLED', label: getProcessStatusLabel('CANCELLED') },
  { value: 'SUSPENDED', label: getProcessStatusLabel('SUSPENDED') },
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

/** پاسخ API / مدل DB ممکن است snake_case یا PascalCase باشد */
function pickProcessUpdatedAt(p) {
  if (!p || typeof p !== 'object') return null;
  return (
    p.UpdatedAt ??
    p.updated_at ??
    p.updatedAt ??
    p.last_updated_at ??
    p.LastUpdatedAt ??
    null
  );
}

function pickProcessInstanceId(p) {
  if (!p || typeof p !== 'object') return null;
  const v = p.ID ?? p.id ?? p.process_instance_id ?? p.ProcessInstanceID ?? p.ProcessInstanceId;
  return v != null ? v : null;
}

function mapItemsToRows(items) {
  return (items || []).map((item) => {
    const p = item.process;
    const pid = pickProcessInstanceId(p);
    const latest = pickRepresentativeTaskForProcessRow(item.tasks);
    const key = p?.definition_key ?? p?.DefinitionKey ?? '';
    const rejectState = p ? parseEngineProcessRejectState(p) : null;
    const processStatus = rejectState?.rejected ? 'REJECTED' : (p?.status ?? p?.Status ?? '—');
    return {
      id: pid,
      processInstanceId: pid,
      definitionKey: key,
      serviceLabel: DEFINITION_LABELS[key] || key || '—',
      processStatus,
      applicantName: p.variables?.applicant_name ?? '—',
      startedAt: p.started_at ?? p.StartedAt ?? null,
      updatedAt: pickProcessUpdatedAt(p),
      currentTaskName: latest?.name ?? '—',
      currentElementId: latest?.element_id ?? '—',
      currentTaskStatus: latest?.status ?? '—',
      currentTaskType: latest?.type ?? '—',
      /** برای صفحهٔ خدمت۱: ادغام با API وقتی تسک‌های DONE در tasks/فرایند نیستند */
      tasksSnapshot: item.tasks,
    };
  })
    .filter((row) => row.processInstanceId != null && String(row.processInstanceId) !== '');
}

function processStatusColor(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'COMPLETED' || s === 'DONE') return 'success';
  if (s === 'REJECTED' || s === 'FAILED' || s === 'CANCELLED') return 'error';
  if (s === 'WAITING_CENTRAL' || s === 'WAITING_BRANCH' || s === 'WAITING_EXTERNAL' || s === 'LOCKED') {
    return 'warning';
  }
  if (s === 'RUNNING') return 'info';
  if (s === 'SUSPENDED') return 'default';
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

  const filteredRows = useMemo(() => allRows.filter((row) => {
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
    }), [allRows, submittedFilters]);

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
      if (row.tasksSnapshot != null) {
        writeService1TasksSnapshot(row.processInstanceId, row.tasksSnapshot);
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
      renderCell: (params) => {
        const isRejected = String(params.value || '').toUpperCase() === 'REJECTED';
        return (
          <Chip
            label={getProcessStatusLabel(params.value)}
            size="small"
            color={processStatusColor(params.value)}
            variant={isRejected ? 'filled' : 'outlined'}
            sx={
              isRejected
                ? {
                    fontWeight: 700,
                    borderColor: 'error.dark',
                  }
                : undefined
            }
          />
        );
      },
    },
    {
      field: 'startedAt',
      headerName: 'تاریخ شروع / آخرین بروزرسانی',
      flex: 1.15,
      minWidth: 178,
      renderCell: (params) => {
        const row = params.row;
        const start = row.startedAt;
        const updated = row.updatedAt;
        if (!start && !updated) {
          return '—';
        }
        const fmt = (v) => (v ? dayjs(v).format('YYYY/MM/DD HH:mm') : '—');
        return (
          <Stack component="span" spacing={0.35} sx={{ py: 0.5, lineHeight: 1.35 }}>
            <Typography variant="caption" component="span" display="block" color="text.secondary">
              شروع: {fmt(start)}
            </Typography>
            <Typography variant="caption" component="span" display="block" fontWeight={600}>
              بروزرسانی: {fmt(updated)}
            </Typography>
          </Stack>
        );
      },
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
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field.Text name="processId" label="شماره فرایند" placeholder="مثلاً 1749882971" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field.Select name="definitionKey" label="نوع خدمت">
                    {DEFINITION_OPTIONS.map((item) => (
                      <MenuItem key={item.value || 'all'} value={item.value}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field.Select name="processStatus" label="وضعیت فرایند">
                    {PROCESS_STATUS_OPTIONS.map((item) => (
                      <MenuItem key={item.value || 'all'} value={item.value}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Field.Text name="applicantName" label="نام متقاضی" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
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
