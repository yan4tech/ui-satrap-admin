import { fToNow } from 'src/utils/format-time';

import { resolveNotificationHref } from 'src/lib/notification-navigation';

import { toFaDigits } from '../_components/to-fa-digits';

// ----------------------------------------------------------------------

/** @typedef {import('src/lib/dashboard-api').BranchOverviewResponse} BranchOverviewResponse */
/** @typedef {import('src/lib/dashboard-api').UserOverviewResponse} UserOverviewResponse */

// Default icons from original branch/overview mock (index fallback when API omits icon).
const BRANCH_KPI_ICONS = [
  'solar:users-group-rounded-bold-duotone',
  'solar:calendar-bold-duotone',
  'solar:hourglass-line-duotone',
  'solar:check-circle-bold-duotone',
];

const BRANCH_KPI_AVATAR_BY_INDEX = [
  null,
  null,
  { avatarBg: 'warning.lighter', avatarColor: 'warning.main' },
  { avatarBg: 'success.lighter', avatarColor: 'success.main' },
];

/** Title-based KPI icons — mirrors backend decorateBranchKpiIcons. */
const BRANCH_KPI_ICON_BY_TITLE = {
  'کاربران شعبه': 'solar:users-group-rounded-bold-duotone',
  'درخواست امروز': 'solar:calendar-bold-duotone',
  'در انتظار بررسی': 'solar:hourglass-line-duotone',
  'تکمیل این ماه': 'solar:check-circle-bold-duotone',
};

// Default icons from original branch/user mock.
const USER_KPI_ICONS = [
  'solar:inbox-in-bold-duotone',
  'solar:check-circle-bold-duotone',
  'solar:clock-circle-bold-duotone',
  'solar:medal-ribbons-star-bold-duotone',
];

const USER_KPI_AVATAR_BY_INDEX = [
  { avatarBg: 'warning.lighter', avatarColor: 'warning.main' },
  { avatarBg: 'success.lighter', avatarColor: 'success.main' },
  null,
  { avatarBg: 'info.lighter', avatarColor: 'info.main' },
];

const USER_KPI_ICON_BY_TITLE = {
  'درخواست‌های من (باز)': 'solar:inbox-in-bold-duotone',
  'تکمیل‌شده این هفته': 'solar:check-circle-bold-duotone',
  'میانگین زمان رسیدگی': 'solar:clock-circle-bold-duotone',
  'نرخ پذیرش من': 'solar:medal-ribbons-star-bold-duotone',
};

const PULSE_STAT_ICONS = [
  'solar:inbox-bold-duotone',
  'solar:users-group-two-rounded-bold-duotone',
  'solar:chart-2-bold-duotone',
];

const ACTIVITY_ICONS = [
  'solar:document-add-bold-duotone',
  'solar:check-read-bold-duotone',
  'solar:user-plus-bold-duotone',
  'solar:chart-2-bold-duotone',
];

const TIMELINE_ICONS = [
  'solar:check-read-bold-duotone',
  'solar:transfer-horizontal-bold-duotone',
  'solar:notes-bold-duotone',
  'solar:archive-check-bold-duotone',
];

const STATUS_BAR_COLORS = ['warning.main', 'info.main', 'success.main', 'error.main'];
const PERFORMANCE_BAR_COLORS = ['primary.main', 'info.main', 'success.main', 'warning.main'];

// ----------------------------------------------------------------------

function formatLastSyncLabel(lastSyncAt) {
  if (!lastSyncAt) return '';
  const label = fToNow(lastSyncAt);
  return label === 'Invalid date' ? '' : label;
}

function resolveKpiIcon(kpi, index, iconDefaults, iconByTitle) {
  if (kpi.icon) return kpi.icon;
  const title = String(kpi.title ?? '').trim();
  if (title && iconByTitle[title]) return iconByTitle[title];
  return iconDefaults[index] || 'solar:chart-2-bold-duotone';
}

function mapKpis(
  kpis,
  { avatarDefaults = BRANCH_KPI_AVATAR_BY_INDEX, iconDefaults = BRANCH_KPI_ICONS, iconByTitle = BRANCH_KPI_ICON_BY_TITLE } = {}
) {
  return (kpis ?? []).map((kpi, index) => ({
    title: kpi.title ?? '',
    value: kpi.value ?? '—',
    change: kpi.change ?? '',
    trend: kpi.trend === 'down' ? 'down' : 'up',
    icon: resolveKpiIcon(kpi, index, iconDefaults, iconByTitle),
    ...(avatarDefaults[index] ?? {}),
  }));
}

function mapServiceBreakdown(items) {
  return (items ?? []).map((item) => ({
    name: item.name ?? '',
    waitingReview: Number(item.waiting_review ?? 0),
    waitingRegistryReply: Number(item.waiting_registry_reply ?? 0),
    completed: Number(item.completed ?? 0),
    rejected: Number(item.rejected ?? 0),
  }));
}

function mapBarItems(items, colorDefaults = STATUS_BAR_COLORS) {
  return (items ?? []).map((item, index) => ({
    label: item.label ?? '',
    value: Number(item.value ?? 0),
    color: item.color || colorDefaults[index % colorDefaults.length] || 'primary.main',
  }));
}

/** Maps `weekly_activity: number[]` → HorizontalBarsCard `items`. */
function mapWeeklyActivityBars(values, color = 'primary.main') {
  const series = Array.isArray(values) ? values : [];
  return series.map((value, index) => ({
    label: `روز ${index + 1}`,
    value: Number(value ?? 0),
    color,
  }));
}

function normalizeInboxPriority(priority) {
  const value = String(priority ?? 'medium').toLowerCase();
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'medium';
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function toAsciiDigits(value) {
  return String(value ?? '').replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)));
}

/** @param {import('src/lib/dashboard-api').InboxPreviewItem | null | undefined} item */
export function resolveInboxPreviewHref(item) {
  if (!item) return null;

  const processInstanceId =
    item.process_instance_id ??
    item.processInstanceId ??
    parseProcessIdFromDisplayId(item.id);

  if (processInstanceId == null || String(processInstanceId).trim() === '') {
    return null;
  }

  const taskId = item.task_id ?? item.taskId;
  const definitionKey = item.definition_key ?? item.definitionKey;

  return resolveNotificationHref({
    processInstanceId,
    taskId,
    definitionKey,
  });
}

function parseProcessIdFromDisplayId(id) {
  const normalized = toAsciiDigits(id).trim();
  const match = /^REQ-(\d+)$/i.exec(normalized);
  return match ? match[1] : null;
}

function mapInboxItems(items) {
  return (items ?? []).map((item) => {
    const href = resolveInboxPreviewHref(item);
    return {
      id: toFaDigits(item.id ?? ''),
      service: item.service ?? '',
      applicant: item.applicant ?? '',
      wait: toFaDigits(item.wait ?? ''),
      ...(item.step ? { step: item.step } : {}),
      priority: normalizeInboxPriority(item.priority),
      ...(href ? { href } : {}),
    };
  });
}

/** First routable inbox task href — for «شروع رسیدگی» CTA. */
export function resolveFirstInboxActionHref(items) {
  for (const item of items ?? []) {
    const href = item?.href ?? resolveInboxPreviewHref(item);
    if (href) return href;
  }
  return null;
}

function mapActivityItems(items, iconDefaults = ACTIVITY_ICONS) {
  return (items ?? []).map((item, index) => ({
    title: item.title ?? '',
    subtitle: item.subtitle ?? '',
    icon: item.icon || iconDefaults[index % iconDefaults.length] || 'solar:history-bold-duotone',
  }));
}

function mapPulseStats(items) {
  return (items ?? []).map((item, index) => ({
    label: item.label ?? '',
    value: Number(item.value ?? 0),
    hint: toFaDigits(item.hint ?? ''),
    icon: item.icon || PULSE_STAT_ICONS[index % PULSE_STAT_ICONS.length] || 'solar:chart-2-bold-duotone',
  }));
}

function findKpiValue(kpis, keyword) {
  const match = (kpis ?? []).find((k) => String(k.title ?? '').includes(keyword));
  if (!match) return null;
  const raw = String(match.value ?? '').replace(/[^\d]/g, '');
  return raw ? Number(raw) : null;
}

function countUrgentInbox(items) {
  return (items ?? []).filter((item) => String(item.priority ?? '').toLowerCase() === 'high').length;
}

function parseNumericValue(value) {
  const raw = String(value ?? '').replace(/[^\d]/g, '');
  return raw ? Number(raw) : 0;
}

/**
 * Maps `GET /engine/dashboard/branch/overview` response → props for `branch/overview/page.jsx`.
 * @param {BranchOverviewResponse | null | undefined} api
 */
export function mapBranchOverview(api) {
  if (!api) return null;

  const meta = api.meta ?? {};
  const kpis = mapKpis(api.kpis);
  const pendingReviews = mapInboxItems(api.pending_reviews);
  const statusDistribution = mapBarItems(api.status_distribution, STATUS_BAR_COLORS);
  const inboxCount =
    findKpiValue(api.kpis, 'انتظار') ??
    (pendingReviews.length || statusDistribution[0]?.value) ??
    0;
  const monthCompleted =
    findKpiValue(api.kpis, 'تکمیل') ??
    statusDistribution.find((b) => b.label.includes('پایان'))?.value ??
    0;

  const lastSyncLabel = formatLastSyncLabel(meta.last_sync_at);

  return {
    meta: {
      branchName: meta.branch_name ?? '',
      branchCode: meta.branch_code ?? '',
      managerName: meta.manager_name ?? '',
      lastSyncLabel,
      bannerSubtitle: lastSyncLabel
        ? `وضعیت عملیاتی شعبه · آخرین همگام‌سازی ${lastSyncLabel}`
        : 'وضعیت عملیاتی شعبه',
    },
    branchName: meta.branch_name ?? '',
    branchCode: meta.branch_code ?? '',
    managerName: meta.manager_name ?? '',
    lastSyncLabel,
    kpis,
    serviceBreakdown: mapServiceBreakdown(api.service_breakdown),
    weeklyActivity: mapWeeklyActivityBars(api.weekly_activity, 'primary.main'),
    statusDistribution,
    operatorPerformance: mapBarItems(api.operator_performance, PERFORMANCE_BAR_COLORS),
    pendingReviews,
    teamMembers: (api.team_members ?? []).map((m) => ({
      name: m.name ?? '',
      role: m.role ?? '',
      status: m.status ?? '',
      color: m.color ?? 'default',
    })),
    branchAlerts: (api.alerts ?? []).map((a) => ({
      label: a.label ?? '',
      progress: Number(a.progress ?? 0),
    })),
    serviceStatus: (api.service_status ?? []).map((s) => ({
      name: s.name ?? '',
      state: s.state ?? '',
      color: s.color ?? 'default',
    })),
    latestActivities: mapActivityItems(api.activities, ACTIVITY_ICONS),
    banner: {
      inboxCount,
      monthCompleted,
      subtitle: meta.last_sync_at
        ? `آخرین همگام‌سازی ${formatLastSyncLabel(meta.last_sync_at)}`
        : '',
    },
    isEmpty:
      !kpis.length &&
      !(api.service_breakdown ?? []).length &&
      !mapWeeklyActivityBars(api.weekly_activity).some((b) => b.value > 0) &&
      !statusDistribution.length &&
      !(api.operator_performance ?? []).length &&
      !pendingReviews.length &&
      !(api.team_members ?? []).length &&
      !(api.alerts ?? []).length &&
      !(api.service_status ?? []).length &&
      !(api.activities ?? []).length,
  };
}

/**
 * Maps `GET /engine/dashboard/user/overview` response → props for `branch/user/page.jsx`.
 * @param {UserOverviewResponse | null | undefined} api
 */
export function mapUserOverview(api) {
  if (!api) return null;

  const meta = api.meta ?? {};
  const kpis = mapKpis(api.kpis, {
    avatarDefaults: USER_KPI_AVATAR_BY_INDEX,
    iconDefaults: USER_KPI_ICONS,
    iconByTitle: USER_KPI_ICON_BY_TITLE,
  });
  const inbox = mapInboxItems(api.inbox);
  const personalQueue = findKpiValue(api.kpis, 'باز') ?? inbox.length ?? 0;
  const urgentCount = countUrgentInbox(api.inbox) || parseNumericValue(kpis[0]?.change);

  const weeklyGoal = api.weekly_goal ?? {};
  const myKpis = kpis;
  const branchPulse = mapPulseStats(api.pulse_stats);
  const serviceBreakdown = mapServiceBreakdown(api.service_breakdown);
  const myServiceBreakdown = serviceBreakdown;
  const weeklyMine = mapWeeklyActivityBars(api.weekly_activity, 'info.main');
  const myStatusMix = mapBarItems(api.status_mix, STATUS_BAR_COLORS);
  const timeline = mapActivityItems(api.timeline, TIMELINE_ICONS);
  const mappedWeeklyGoal = {
    title: weeklyGoal.title ?? 'پیشرفت هدف هفتگی',
    subheader: weeklyGoal.subheader ?? '',
    progress: Number(weeklyGoal.progress ?? 0),
    description: weeklyGoal.description ?? '',
  };

  const hasContent =
    myKpis.length > 0 ||
    branchPulse.length > 0 ||
    inbox.length > 0 ||
    myServiceBreakdown.length > 0 ||
    weeklyMine.some((bar) => bar.value > 0) ||
    myStatusMix.length > 0 ||
    timeline.length > 0 ||
    mappedWeeklyGoal.progress > 0 ||
    Boolean(mappedWeeklyGoal.subheader || mappedWeeklyGoal.description);

  return {
    branchContext: {
      name: meta.branch_name ?? '',
      code: meta.branch_code ?? '',
    },
    branchName: meta.branch_name ?? '',
    branchCode: meta.branch_code ?? '',
    userName: meta.user_name ?? '',
    roleTitle: meta.role_title ?? '',
    lastSyncLabel: formatLastSyncLabel(meta.last_sync_at),
    kpis: myKpis,
    myKpis,
    pulseStats: branchPulse,
    branchPulse,
    serviceBreakdown,
    myServiceBreakdown,
    weeklyActivity: weeklyMine,
    weeklyMine,
    statusMix: myStatusMix,
    myStatusMix,
    weeklyGoal: mappedWeeklyGoal,
    inbox,
    timeline,
    banner: {
      personalQueue,
      urgentCount,
      lastActivityLabel: meta.last_sync_at ? formatLastSyncLabel(meta.last_sync_at) : '',
      dailyGoalLabel: weeklyGoal.subheader ? weeklyGoal.subheader.split('·').pop()?.trim() : '',
    },
    isEmpty: !hasContent,
  };
}

/** @param {number | string | null | undefined} value */
export function faCount(value) {
  if (value == null || value === '') return toFaDigits('0');
  return toFaDigits(value);
}
