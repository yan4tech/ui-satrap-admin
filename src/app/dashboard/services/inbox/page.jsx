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
  MenuItem,
  TextField,
  Typography,
  CardContent,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useSearchParams } from 'next/navigation';
import { resolveNotificationHref } from 'src/lib/notification-navigation';
import { useAuthContext } from 'src/auth/hooks';
import { useEntitledServices } from 'src/hooks/use-entitled-services';
import {
  INBOX_MODE,
  INBOX_MODE_LABELS,
  INBOX_ROLE_LABELS,
  mergeInboxModes,
  resolveInboxModesForUser,
} from 'src/lib/work-inbox';

import { getBpmnElementLabel } from '../_lib/process-history-labels';
import {
  fetchWorkInbox,
  fetchWorkInboxCounts,
  writeService1TasksSnapshot,
  parseEngineProcessRejectState,
  taskReviewBranchId,
} from '../one/engine-api';

const DEFINITION_LABELS = {
  service1: 'خدمت شماره یک',
  service2: 'خدمت شماره دو',
  service3: 'خدمت شماره سه',
  service4: 'خدمت شماره چهار',
};

const DEFINITION_OPTIONS = [
  { value: '', label: 'همه خدمات' },
  { value: 'service1', label: DEFINITION_LABELS.service1 },
  { value: 'service2', label: DEFINITION_LABELS.service2 },
  { value: 'service3', label: DEFINITION_LABELS.service3 },
  { value: 'service4', label: DEFINITION_LABELS.service4 },
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

function resolveCurrentTaskLabel(task) {
  if (!task || typeof task !== 'object') return '—';
  const elementId = String(task.element_id ?? task.ElementID ?? '').trim();
  const label = getBpmnElementLabel(elementId);
  if (label && label !== '—' && label !== elementId) return label;
  const name = String(task.name ?? '').trim();
  return name || elementId || '—';
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
        currentTaskName: resolveCurrentTaskLabel(t),
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
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  const { isBranchEntitlementActive, processKeys } = useEntitledServices();

  const defaultModes = useMemo(() => resolveInboxModesForUser(user), [user]);
  const [activeMode, setActiveMode] = useState(defaultModes[0] ?? INBOX_MODE.continue);
  const [availableModes, setAvailableModes] = useState(defaultModes);
  const [definitionKeyFilter, setDefinitionKeyFilter] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [modeCounts, setModeCounts] = useState({ [INBOX_MODE.continue]: 0, [INBOX_MODE.review]: 0 });
  const [service4Counts, setService4Counts] = useState({ continueTasks: 0, reviewTasks: 0 });
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const hasService4Entitlement = useMemo(() => {
    if (!isBranchEntitlementActive) return true;
    return !processKeys?.length || processKeys.includes('service4');
  }, [isBranchEntitlementActive, processKeys]);

  const definitionOptions = useMemo(() => {
    if (!isBranchEntitlementActive || !processKeys?.length) {
      return DEFINITION_OPTIONS;
    }
    return [
      { value: '', label: 'همه خدمات' },
      ...DEFINITION_OPTIONS.filter((o) => o.value && processKeys.includes(o.value)),
    ];
  }, [isBranchEntitlementActive, processKeys]);

  const loadInboxCounts = useCallback(async () => {
    try {
      const filterKey = definitionKeyFilter || undefined;
      const counts = await fetchWorkInboxCounts(
        filterKey ? { definitionKey: filterKey } : undefined,
      );
      setModeCounts({
        [INBOX_MODE.continue]: counts.continueTasks,
        [INBOX_MODE.review]: counts.reviewTasks,
      });
      if (hasService4Entitlement && filterKey !== 'service4') {
        const s4 = await fetchWorkInboxCounts({ definitionKey: 'service4' });
        setService4Counts({
          continueTasks: s4.continueTasks,
          reviewTasks: s4.reviewTasks,
        });
      } else if (filterKey === 'service4') {
        setService4Counts({
          continueTasks: counts.continueTasks,
          reviewTasks: counts.reviewTasks,
        });
      } else {
        setService4Counts({ continueTasks: 0, reviewTasks: 0 });
      }
    } catch {
      setModeCounts({ [INBOX_MODE.continue]: 0, [INBOX_MODE.review]: 0 });
      setService4Counts({ continueTasks: 0, reviewTasks: 0 });
    }
  }, [definitionKeyFilter, hasService4Entitlement]);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = paginationModel.page * paginationModel.pageSize;
      const data = await fetchWorkInbox({
        mode: activeMode,
        definitionKey: definitionKeyFilter || undefined,
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
  }, [activeMode, definitionKeyFilter, paginationModel.page, paginationModel.pageSize, user]);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    void loadInboxCounts();
  }, [loadInboxCounts]);

  /** لینک قدیمی اعلان‌ها: inbox?processId=… → همان باز کردن صفحهٔ خدمت */
  useEffect(() => {
    const processId = searchParams.get('processId');
    if (!processId || String(processId).trim() === '') return;
    const href = resolveNotificationHref({
      processInstanceId: processId,
      taskId: searchParams.get('taskId') ?? undefined,
      definitionKey: searchParams.get('definitionKey') ?? 'service1',
      actionPath: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '',
    });
    if (href && !href.includes('/inbox')) {
      router.replace(href);
    }
  }, [searchParams, router]);

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
      if (key === 'service4') {
        router.push(`${paths.dashboard.services.four}${qs}`);
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
              onClick={() => {
                void loadInbox();
                void loadInboxCounts();
              }}
              disabled={loading}
            >
              بروزرسانی
            </Button>
          </Stack>

          {hasService4Entitlement &&
          (service4Counts.continueTasks > 0 || service4Counts.reviewTasks > 0) ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <Chip
                size="small"
                color="info"
                variant="soft"
                label={`${DEFINITION_LABELS.service4} — ${INBOX_ROLE_LABELS[INBOX_MODE.continue]}: ${service4Counts.continueTasks}`}
              />
              <Chip
                size="small"
                color="warning"
                variant="soft"
                label={`${DEFINITION_LABELS.service4} — ${INBOX_ROLE_LABELS[INBOX_MODE.review]}: ${service4Counts.reviewTasks}`}
              />
            </Stack>
          ) : null}

          {showTabs ? (
            <Tabs
              value={activeMode}
              onChange={(_, v) => {
                setActiveMode(v);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
              }}
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              {availableModes.map((mode) => {
                const count = modeCounts[mode] ?? 0;
                const tabLabel = INBOX_MODE_LABELS[mode] ?? mode;
                return (
                  <Tab
                    key={mode}
                    value={mode}
                    label={
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <span>{tabLabel}</span>
                        {count > 0 ? (
                          <Chip size="small" label={count} color="primary" variant="soft" />
                        ) : null}
                      </Stack>
                    }
                    icon={<Icon icon="solar:inbox-in-bold-duotone" width={20} />}
                    iconPosition="start"
                  />
                );
              })}
            </Tabs>
          ) : null}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ sm: 'center' }}
            sx={{ mb: 2 }}
          >
            <TextField
              select
              size="small"
              label="نوع خدمت"
              value={definitionKeyFilter}
              onChange={(e) => {
                setDefinitionKeyFilter(e.target.value);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
              }}
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
            >
              {definitionOptions.map((option) => (
                <MenuItem key={option.value || 'all'} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
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
