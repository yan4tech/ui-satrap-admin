'use client';

import dayjs from 'dayjs';
import { Icon } from '@iconify/react';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Card,
  Chip,
  Stack,
  Alert,
  NoSsr,
  Button,
  Tooltip,
  Tab,
  Tabs,
  Typography,
  CardContent,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useAuthContext } from 'src/auth/hooks';
import { useEntitledServices } from 'src/hooks/use-entitled-services';
import {
  INBOX_MODE,
  INBOX_MODE_LABELS,
  mergeInboxModes,
  resolveInboxModesForUser,
} from 'src/lib/work-inbox';

import {
  fetchWorkInbox,
  writeService1TasksSnapshot,
  parseEngineProcessRejectState,
  taskReviewBranchId,
} from '../one/engine-api';

const DEFINITION_LABELS = {
  service1: 'خدمت شماره یک',
  service2: 'خدمت شماره دو',
  service3: 'خدمت شماره سه',
};

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

function pickProcessInstanceId(p) {
  if (!p || typeof p !== 'object') return null;
  const v = p.ID ?? p.id ?? p.process_instance_id;
  return v != null ? v : null;
}

function pickProcessCreatedAt(p) {
  if (!p || typeof p !== 'object') return null;
  return p.CreatedAt ?? p.created_at ?? p.createdAt ?? null;
}

function pickProcessUpdatedAt(p) {
  if (!p || typeof p !== 'object') return null;
  return p.UpdatedAt ?? p.updated_at ?? p.updatedAt ?? null;
}

function mapInboxItemsToRows(items) {
  return (items || [])
    .map((item) => {
      const p = item.process ?? item.Process;
      const t = item.task ?? item.Task;
      const pid = pickProcessInstanceId(p);
      const key = p?.definition_key ?? p?.DefinitionKey ?? '';
      const rejectState = p ? parseEngineProcessRejectState(p) : null;
      const processStatus = rejectState?.rejected ? 'REJECTED' : (p?.status ?? p?.Status ?? '—');
      return {
        id: pid,
        processInstanceId: pid,
        taskId: t?.ID ?? t?.id ?? null,
        definitionKey: key,
        serviceLabel: DEFINITION_LABELS[key] || key || '—',
        processStatus,
        applicantName: p?.variables?.applicant_name ?? '—',
        createdAt: pickProcessCreatedAt(p),
        updatedAt: pickProcessUpdatedAt(p),
        currentTaskName: t?.name ?? '—',
        currentElementId: t?.element_id ?? t?.ElementID ?? '—',
        currentTaskStatus: t?.status ?? '—',
        currentTaskType: t?.type ?? '—',
        assignedBranchId: t ? taskReviewBranchId(t) : null,
        tasksSnapshot: t ? [t] : [],
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
  return 'default';
}

export default function ServicesInboxPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { isBranchEntitlementActive, processKeys } = useEntitledServices();

  const defaultModes = useMemo(() => resolveInboxModesForUser(user), [user]);
  const [activeMode, setActiveMode] = useState(defaultModes[0] ?? INBOX_MODE.continue);
  const [availableModes, setAvailableModes] = useState(defaultModes);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const loadInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = paginationModel.page * paginationModel.pageSize;
      const data = await fetchWorkInbox({
        mode: activeMode,
        limit: paginationModel.pageSize,
        offset,
      });
      const modes = mergeInboxModes(data.availableModes, user);
      setAvailableModes(modes);
      if (!modes.includes(activeMode) && modes.length) {
        setActiveMode(modes[0]);
      }
      setRows(mapInboxItemsToRows(data.items));
      setTotal(Number(data.total) || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در دریافت صندوق کار.');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [activeMode, paginationModel.page, paginationModel.pageSize, user]);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  const filteredRows = useMemo(() => {
    if (!isBranchEntitlementActive || !processKeys?.length) return rows;
    return rows.filter((row) => processKeys.includes(String(row.definitionKey || '').trim()));
  }, [rows, isBranchEntitlementActive, processKeys]);

  const handleViewDetails = useCallback(
    (row) => {
      const key = row.definitionKey;
      const q = new URLSearchParams();
      q.set('processId', String(row.processInstanceId));
      q.set('definitionKey', String(key || 'service1'));
      if (row.taskId != null) q.set('taskId', String(row.taskId));
      const qs = `?${q.toString()}`;

      if (key === 'service3') {
        router.push(`${paths.dashboard.services.three}${qs}`);
        return;
      }
      if (key === 'service2') {
        router.push(`${paths.dashboard.services.two}${qs}`);
        return;
      }
      if (row.tasksSnapshot?.length) {
        writeService1TasksSnapshot(row.processInstanceId, row.tasksSnapshot);
      }
      router.push(`${paths.dashboard.services.one}${qs}`);
    },
    [router],
  );

  const columns = useMemo(
    () => [
      {
        field: 'processInstanceId',
        headerName: 'شماره فرایند',
        flex: 0.85,
        minWidth: 110,
      },
      {
        field: 'serviceLabel',
        headerName: 'خدمت',
        flex: 1,
        minWidth: 120,
      },
      {
        field: 'applicantName',
        headerName: 'متقاضی',
        flex: 1,
        minWidth: 100,
      },
      {
        field: 'processStatus',
        headerName: 'وضعیت فرایند',
        flex: 0.9,
        minWidth: 120,
        renderCell: (params) => (
          <Chip
            label={getProcessStatusLabel(params.value)}
            size="small"
            color={processStatusColor(params.value)}
            variant="outlined"
          />
        ),
      },
      {
        field: 'currentTaskName',
        headerName: 'مرحله جاری',
        flex: 1.1,
        minWidth: 140,
      },
      {
        field: 'updatedAt',
        headerName: 'آخرین بروزرسانی',
        flex: 0.9,
        minWidth: 130,
        valueFormatter: (value) => (value ? dayjs(value).format('YYYY/MM/DD HH:mm') : '—'),
      },
      {
        field: 'actions',
        headerName: 'اقدام',
        align: 'center',
        headerAlign: 'center',
        flex: 0.6,
        minWidth: 90,
        sortable: false,
        renderCell: (params) => (
          <Tooltip title="شروع / ادامه کار">
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => handleViewDetails(params.row)}
              startIcon={<Icon icon="solar:play-circle-bold" width={18} />}
            >
              اقدام
            </Button>
          </Tooltip>
        ),
      },
    ],
    [handleViewDetails],
  );

  const showTabs = availableModes.length > 1;

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h5">صندوق کار</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                تسک‌های باز (CREATED) در محدودهٔ شعبهٔ شما — ادامه کار یا صف بررسی. شعبه مرکزی مانند سایر شعب است.
                برای گزارش‌گیری از «گزارش فرایندها» استفاده کنید.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Icon icon="solar:refresh-linear" width={18} />}
              onClick={() => void loadInbox()}
              disabled={loading}
            >
              بروزرسانی
            </Button>
          </Stack>

          {showTabs ? (
            <Tabs
              value={activeMode}
              onChange={(_, v) => {
                setActiveMode(v);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
              }}
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              {availableModes.map((mode) => (
                <Tab
                  key={mode}
                  value={mode}
                  label={INBOX_MODE_LABELS[mode] ?? mode}
                  icon={<Icon icon="solar:inbox-in-bold-duotone" width={20} />}
                  iconPosition="start"
                />
              ))}
            </Tabs>
          ) : null}

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
                rowCount={total}
                paginationMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 20, 50]}
                autoHeight
                disableRowSelectionOnClick
              />
            </NoSsr>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
