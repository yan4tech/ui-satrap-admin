import dayjs from 'dayjs';
import jalaliday from 'jalaliday';

dayjs.extend(jalaliday);
dayjs.calendar('jalali');
dayjs.locale('fa');

/** Labels for audit_events — keep actions in sync with audit/constants.go */

/** هفت روز اخیر شامل امروز (۷ روز تقویمی) */
const DEFAULT_RANGE_DAYS_INCLUSIVE = 7;

/** @returns {import('dayjs').Dayjs} */
function jalaliDay(value) {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value.calendar('jalali');
  const d = dayjs(value).calendar('jalali');
  return d.isValid() ? d : null;
}

/** Default filter: last 7 calendar days through today (jalali dayjs instances for DatePicker). */
export function defaultAuditDateRange() {
  const to = dayjs().calendar('jalali').endOf('day');
  const from = dayjs()
    .calendar('jalali')
    .subtract(DEFAULT_RANGE_DAYS_INCLUSIVE - 1, 'day')
    .startOf('day');
  return { from, to };
}

/** Full form defaults — call on mount/reset so dates are computed with jalali calendar. */
export function getDefaultAuditFilters() {
  const { from, to } = defaultAuditDateRange();
  return {
    service: '',
    action: '',
    entity_type: '',
    entity_id: '',
    actor_id: '',
    actor_branch_id: '',
    success: '',
    from,
    to,
  };
}

/** @param {unknown} value */
export function auditFilterToISO(value, boundary = 'start') {
  const d = jalaliDay(value);
  if (!d) return null;
  if (boundary === 'end') return d.endOf('day').toDate().toISOString();
  if (boundary === 'exact') return d.toDate().toISOString();
  return d.startOf('day').toDate().toISOString();
}

export const AUDIT_SERVICES = [
  { value: '', label: 'همه' },
  { value: 'membership', label: 'عضویت' },
  { value: 'engine', label: 'موتور فرایند' },
  { value: 'payment', label: 'پرداخت' },
];

export const AUDIT_ACTIONS = [
  { value: '', label: 'همه' },
  { value: 'login.success', label: 'ورود موفق' },
  { value: 'login.failed', label: 'ورود ناموفق' },
  { value: 'logout', label: 'خروج' },
  { value: 'role.create', label: 'ایجاد نقش' },
  { value: 'role.update', label: 'ویرایش نقش' },
  { value: 'role.delete', label: 'حذف نقش' },
  { value: 'role.permission.assign', label: 'افزودن دسترسی به نقش' },
  { value: 'role.permission.revoke', label: 'حذف دسترسی از نقش' },
  { value: 'user.role.change', label: 'تغییر نقش کاربر' },
  { value: 'process.start', label: 'شروع فرایند' },
  { value: 'process.complete', label: 'تکمیل فرایند' },
  { value: 'process.reject', label: 'رد فرایند' },
  { value: 'task.complete', label: 'تکمیل مرحله' },
  { value: 'task.reject', label: 'رد مرحله' },
  { value: 'payment.start', label: 'شروع پرداخت' },
  { value: 'payment.refund', label: 'استرداد پرداخت' },
];

const ACTION_LABEL_MAP = Object.fromEntries(
  AUDIT_ACTIONS.filter((a) => a.value).map((a) => [a.value, a.label])
);

const SERVICE_LABEL_MAP = Object.fromEntries(
  AUDIT_SERVICES.filter((s) => s.value).map((s) => [s.value, s.label])
);

export function auditActionLabel(action) {
  const key = String(action ?? '').trim();
  return ACTION_LABEL_MAP[key] || key || '—';
}

export function auditServiceLabel(service) {
  const key = String(service ?? '').trim();
  return SERVICE_LABEL_MAP[key] || key || '—';
}

/** @param {unknown} raw */
export function parseAuditJson(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object') return raw;
  const text = String(raw).trim();
  if (!text || text === 'null') return null;
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

/** @param {unknown} value */
export function hasAuditJson(value) {
  const parsed = parseAuditJson(value);
  if (parsed == null) return false;
  if (typeof parsed === 'object' && !Array.isArray(parsed)) {
    return Object.keys(parsed).length > 0;
  }
  return true;
}

/** @param {unknown} value */
export function formatAuditJson(value) {
  const parsed = parseAuditJson(value);
  if (parsed == null) return '—';
  try {
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(parsed);
  }
}
