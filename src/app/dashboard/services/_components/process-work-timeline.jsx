'use client';

import dayjs from 'dayjs';
import { Icon } from '@iconify/react';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Timeline from '@mui/lab/Timeline';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import {
  Box,
  Chip,
  Alert,
  Stack,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';

import { fetchBranchesOptions } from 'src/app/dashboard/user/user-api';

import { fetchProcessHistory, fetchProcessInstance, fetchProcessTasks } from '../one/engine-api';
import {
  timelineDotColor,
  normalizeHistoryEntry,
  getProcessActionLabel,
  getProcessStatusLabel,
  getResponsiblePartyLabel,
} from '../_lib/process-history-labels';

function buildTaskBranchMap(tasksInput) {
  const map = new Map();
  const add = (task) => {
    if (!task || typeof task !== 'object') return;
    const id = task.ID ?? task.id;
    const branchId = task.branch_id ?? task.BranchID ?? 0;
    if (id != null && branchId) map.set(Number(id), Number(branchId));
  };
  if (Array.isArray(tasksInput)) {
    tasksInput.forEach(add);
  } else if (tasksInput && typeof tasksInput === 'object') {
    Object.values(tasksInput).forEach(add);
  }
  return map;
}

function actionIcon(action) {
  const key = String(action ?? '').trim().toUpperCase();
  if (key === 'APPROVE') return 'solar:check-circle-bold';
  if (key === 'REJECT') return 'solar:close-circle-bold';
  if (key === 'NEEDS_CORRECTION') return 'solar:pen-new-square-bold';
  if (key === 'SUBMIT_TO_CENTRAL') return 'solar:upload-minimalistic-bold';
  if (key === 'COMPLETE') return 'solar:flag-bold';
  return 'solar:history-bold';
}

function MetaRow({ label, children }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="baseline" flexWrap="wrap" sx={{ mt: 0.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 72 }}>
        {label}:
      </Typography>
      <Box component="span" sx={{ flex: 1 }}>
        {children}
      </Box>
    </Stack>
  );
}

export function ProcessWorkTimeline({ processInstanceId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]);
  const [branchById, setBranchById] = useState(() => new Map());

  const branchTitle = useCallback(
    (branchId) => {
      if (!branchId) return '—';
      const title = branchById.get(Number(branchId));
      return title ? `${title} (#${branchId})` : `شعبه #${branchId}`;
    },
    [branchById],
  );

  const load = useCallback(async () => {
    if (processInstanceId == null) return;
    setLoading(true);
    setError(null);
    try {
      const [historyRaw, tasksRaw, instance, branches] = await Promise.all([
        fetchProcessHistory(processInstanceId),
        fetchProcessTasks(processInstanceId).catch(() => ({})),
        fetchProcessInstance(processInstanceId).catch(() => null),
        fetchBranchesOptions().catch(() => []),
      ]);

      const processBranchId = Number(
        instance?.branch_id ?? instance?.BranchID ?? instance?.variables?.__starter_branch_id ?? 0,
      ) || 0;

      const branchMap = new Map(
        (branches || []).map((b) => [Number(b.id), String(b.title || '').trim() || `شعبه #${b.id}`]),
      );
      setBranchById(branchMap);

      const taskBranchMap = buildTaskBranchMap(tasksRaw);
      const normalized = (historyRaw || [])
        .map(normalizeHistoryEntry)
        .filter(Boolean)
        .map((entry) => ({
          ...entry,
          branchId: taskBranchMap.get(Number(entry.taskId)) || processBranchId || 0,
        }));

      setEntries(normalized);
    } catch (e) {
      setEntries([]);
      setError(e instanceof Error ? e.message : 'خطا در دریافت سیر کار.');
    } finally {
      setLoading(false);
    }
  }, [processInstanceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(
    () =>
      [...entries].sort((a, b) => {
        const ta = new Date(a.performedAt || 0).getTime();
        const tb = new Date(b.performedAt || 0).getTime();
        return ta - tb;
      }),
    [entries],
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Typography
          component="button"
          type="button"
          variant="caption"
          onClick={() => void load()}
          sx={{ cursor: 'pointer', border: 0, bgcolor: 'transparent', color: 'inherit' }}
        >
          تلاش مجدد
        </Typography>
      }>
        {error}
      </Alert>
    );
  }

  if (!sorted.length) {
    return (
      <Alert severity="info" variant="outlined">
        هنوز رویدادی در تاریخچهٔ این فرایند ثبت نشده است.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        نمایش زمانی تغییر وضعیت‌ها، اقدامات (تایید/رد)، اپراتور، شعبه و مرحلهٔ BPMN — برای پیگیری
        اختلاف بین شعبه و شعبه مرکزی.
      </Typography>

      <Timeline position="right" sx={{ p: 0, m: 0 }}>
        {sorted.map((entry, index) => {
          const oldKey = String(entry.oldStatus ?? '').trim().toUpperCase();
          const newKey = String(entry.newStatus ?? '').trim().toUpperCase();
          const statusChanged = oldKey && newKey && oldKey !== newKey;
          const when = entry.performedAt ? dayjs(entry.performedAt).format('YYYY/MM/DD HH:mm') : '—';
          const stepLabel = entry.stepName || entry.stepId || '—';
          const operatorId = Number(entry.performedBy) || 0;
          const dotColor = timelineDotColor(entry);

          return (
            <TimelineItem key={entry.id ?? `${entry.taskId}-${index}`}>
              <TimelineOppositeContent
                color="text.secondary"
                sx={{ flex: 0.2, minWidth: 108, pt: 1.5, fontSize: 12 }}
              >
                {when}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color={dotColor} variant="outlined">
                  <Icon icon={actionIcon(entry.action)} width={16} />
                </TimelineDot>
                {index < sorted.length - 1 ? <TimelineConnector /> : null}
              </TimelineSeparator>
              <TimelineContent sx={{ py: 1.5, px: 1 }}>
                <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                    <Typography variant="subtitle2" fontWeight={800}>
                      {getProcessActionLabel(entry.action)}
                    </Typography>
                    {entry.successful === true ? (
                      <Chip size="small" color="success" variant="outlined" label="موفق" />
                    ) : entry.successful === false ? (
                      <Chip size="small" color="error" variant="outlined" label="ناموفق" />
                    ) : null}
                    {entry.attempt > 0 ? (
                      <Chip size="small" variant="outlined" label={`تلاش ${entry.attempt}`} />
                    ) : null}
                  </Stack>

                  {statusChanged ? (
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label={getProcessStatusLabel(entry.oldStatus)}
                        variant="outlined"
                        sx={{ textDecoration: 'line-through', opacity: 0.85 }}
                      />
                      <Icon icon="solar:arrow-left-linear" width={14} />
                      <Chip size="small" color="primary" label={getProcessStatusLabel(entry.newStatus)} />
                    </Stack>
                  ) : newKey ? (
                    <MetaRow label="وضعیت">
                      <Chip size="small" label={getProcessStatusLabel(entry.newStatus)} />
                    </MetaRow>
                  ) : null}

                  <MetaRow label="مرحله BPMN">
                    <Typography variant="body2" fontWeight={600}>
                      {stepLabel}
                      {entry.stepId && entry.stepName ? (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                          ({entry.stepId})
                        </Typography>
                      ) : null}
                    </Typography>
                  </MetaRow>

                  <MetaRow label="طرف مسئول">
                    <Chip
                      size="small"
                      variant="outlined"
                      label={getResponsiblePartyLabel(entry.responsibleParty)}
                    />
                  </MetaRow>

                  <MetaRow label="اپراتور">
                    <Typography variant="body2" fontWeight={600}>
                      {operatorId > 0 ? `کاربر #${operatorId}` : '—'}
                    </Typography>
                  </MetaRow>

                  <MetaRow label="شعبه">
                    <Typography variant="body2" fontWeight={600}>
                      {branchTitle(entry.branchId)}
                    </Typography>
                  </MetaRow>

                  {entry.errorMessage ? (
                    <Alert severity="error" variant="outlined" sx={{ mt: 1, py: 0.25 }}>
                      <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap' }}>
                        {entry.errorMessage}
                      </Typography>
                    </Alert>
                  ) : null}
                </Paper>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </Box>
  );
}
