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
  getBpmnElementLabel,
  getProcessActionLabel,
  getProcessStatusLabel,
  getResponsiblePartyLabel,
} from '../_lib/process-history-labels';

function resolveHistoryStepLabel(entry) {
  const stepId = String(entry?.stepId ?? '').trim();
  if (stepId) {
    const fromId = getBpmnElementLabel(stepId);
    if (fromId && fromId !== '—') return fromId;
  }
  const stepName = String(entry?.stepName ?? '').trim();
  if (stepName) return stepName;
  return stepId || '—';
}

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

const CLAIM_MAP_MATCH_LABELS = {
  yes: 'بله',
  partial: 'بخشی از آن',
  no: 'خیر',
};

const CLAIM_OWNERSHIP_LABELS = {
  ownership_of_ain: 'مالکیت عین',
  easement_right: 'حق ارتفاق',
  usufruct_right: 'حق انتفاع',
  beneficial_ownership: 'مالکیت منافع',
};

const CLAIM_YES_NO_LABELS = {
  yes: 'بلی',
  no: 'خیر',
};

const CLAIM_PROPERTY_OWNERSHIP_LABELS = {
  land: 'عرصه',
  improvement: 'اعیان',
  land_and_improvement: 'عرصه و اعیان',
  share_and_improvement: 'سهم و اعیان',
  عرصه: 'عرصه',
  اعیان: 'اعیان',
  'عرصه و اعیان': 'عرصه و اعیان',
  'سهم و اعیان': 'سهم و اعیان',
};

export const CLAIM_MAP_DISPLAY_FIELDS = [
  { key: 'claim_registration_tracking_code', label: 'کد رهگیری درج ادعا', icon: 'solar:document-text-bold' },
  { key: 'claim_map_match_status', label: 'وضعیت تطابق نقشه ادعا', icon: 'solar:map-bold' },
  { key: 'subsidiary_map_tracking_code', label: 'کد رهگیری نقشه فرعی', icon: 'solar:map-point-bold' },
  { key: 'claim_ownership_type', label: 'نوع ادعا', icon: 'solar:home-2-bold' },
  { key: 'claim_property_ownership_type', label: 'نوع مالکیت مورد ادعا', icon: 'solar:buildings-3-bold' },
  { key: 'claim_belongs_to_applicant', label: 'تعلق ادعا به متقاضی', icon: 'solar:user-check-bold' },
  { key: 'national_id', label: 'کد ملی متقاضی', icon: 'solar:card-bold' },
  { key: 'mobile', label: 'شماره موبایل متقاضی', icon: 'solar:phone-bold' },
  { key: 'registry_reference_id', label: 'شناسه مرجع سازمان ثبت', icon: 'solar:buildings-2-bold' },
  { key: 'is_village_property', label: 'ملک روستایی', icon: 'solar:home-smile-bold' },
];

export function formatClaimMapValue(key, value) {
  if (value == null || value === '') return '—';
  const raw = String(value).trim();
  if (key === 'claim_map_match_status') return CLAIM_MAP_MATCH_LABELS[raw] ?? raw;
  if (key === 'claim_ownership_type') return CLAIM_OWNERSHIP_LABELS[raw] ?? raw;
  if (key === 'claim_property_ownership_type') return CLAIM_PROPERTY_OWNERSHIP_LABELS[raw] ?? raw;
  if (key === 'claim_belongs_to_applicant') return CLAIM_YES_NO_LABELS[raw] ?? raw;
  if (key === 'is_village_property') return CLAIM_YES_NO_LABELS[raw] ?? raw;
  return raw;
}

export function getVisibleClaimMapFields(claimMapData = {}) {
  return CLAIM_MAP_DISPLAY_FIELDS.filter(({ key }) => {
    if (key === 'subsidiary_map_tracking_code') {
      return claimMapData.claim_map_match_status === 'partial' && claimMapData[key];
    }
    return claimMapData[key] != null && claimMapData[key] !== '';
  });
}

export function ClaimMapDataTimeline({ claimMapData = {}, emptyMessage }) {
  const visibleFields = getVisibleClaimMapFields(claimMapData);

  if (!visibleFields.length) {
    return (
      <Alert severity="warning" variant="outlined">
        {emptyMessage ?? 'دادهٔ نقشه ادعا هنوز در دسترس نیست؛ پس از تکمیل مراحل قبلی دوباره تلاش کنید.'}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        خلاصهٔ اطلاعات نقشه ادعا و پاسخ سازمان ثبت — برای بررسی و تأیید متقاضی.
      </Typography>

      <Timeline position="right" sx={{ p: 0, m: 0 }}>
        {visibleFields.map(({ key, label, icon }, index) => (
          <TimelineItem key={key}>
            <TimelineOppositeContent
              color="text.secondary"
              sx={{ flex: 0.2, minWidth: 48, pt: 1.5, fontSize: 12 }}
            >
              {index + 1}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color="primary" variant="outlined">
                <Icon icon={icon} width={16} />
              </TimelineDot>
              {index < visibleFields.length - 1 ? <TimelineConnector /> : null}
            </TimelineSeparator>
            <TimelineContent sx={{ py: 1.5, px: 1 }}>
              <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={800}>
                  {label}
                </Typography>
                <MetaRow label="مقدار">
                  <Typography variant="body2" fontWeight={600}>
                    {formatClaimMapValue(key, claimMapData[key])}
                  </Typography>
                </MetaRow>
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
}

export function ProcessWorkTimeline({ processInstanceId, labelsOnly = false }) {
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

  const displayEntries = useMemo(() => {
    if (!labelsOnly) return sorted;
    const seen = new Set();
    return sorted.filter((entry) => {
      const key = String(entry.stepId ?? '')
        .trim()
        .toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [labelsOnly, sorted]);

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

  if (!displayEntries.length) {
    return (
      <Alert severity="info" variant="outlined">
        هنوز رویدادی در تاریخچهٔ این فرایند ثبت نشده است.
      </Alert>
    );
  }

  if (labelsOnly) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          مراحل طی‌شدهٔ فرایند — فقط برچسب مرحله.
        </Typography>
        <Timeline position="right" sx={{ p: 0, m: 0 }}>
          {displayEntries.map((entry, index) => {
            const when = entry.performedAt ? dayjs(entry.performedAt).format('YYYY/MM/DD HH:mm') : '—';
            const stepLabel = resolveHistoryStepLabel(entry);
            return (
              <TimelineItem key={entry.id ?? `${entry.stepId}-${index}`}>
                <TimelineOppositeContent
                  color="text.secondary"
                  sx={{ flex: 0.2, minWidth: 108, pt: 1.5, fontSize: 12 }}
                >
                  {when}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color="primary" variant="outlined">
                    <Icon icon="solar:flag-bold" width={16} />
                  </TimelineDot>
                  {index < displayEntries.length - 1 ? <TimelineConnector /> : null}
                </TimelineSeparator>
                <TimelineContent sx={{ py: 1.5, px: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {stepLabel}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        نمایش زمانی تغییر وضعیت‌ها، اقدامات (تایید/رد)، اپراتور، شعبه و مرحلهٔ BPMN — برای پیگیری
        اختلاف بین شعبه و شعبه مرکزی.
      </Typography>

      <Timeline position="right" sx={{ p: 0, m: 0 }}>
        {displayEntries.map((entry, index) => {
          const oldKey = String(entry.oldStatus ?? '').trim().toUpperCase();
          const newKey = String(entry.newStatus ?? '').trim().toUpperCase();
          const statusChanged = oldKey && newKey && oldKey !== newKey;
          const when = entry.performedAt ? dayjs(entry.performedAt).format('YYYY/MM/DD HH:mm') : '—';
          const stepLabel = resolveHistoryStepLabel(entry);
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
                {index < displayEntries.length - 1 ? <TimelineConnector /> : null}
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
