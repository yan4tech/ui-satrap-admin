import dayjs from 'dayjs';
import jalaliday from 'jalaliday';

import { SERVICE_LABEL_OPTIONS } from 'src/lib/service-labels';

dayjs.extend(jalaliday);
dayjs.calendar('jalali');
dayjs.locale('fa');

/** هفت روز اخیر شامل امروز (۷ روز تقویمی) */
const DEFAULT_RANGE_DAYS_INCLUSIVE = 7;

/** @returns {import('dayjs').Dayjs | null} */
function jalaliDay(value) {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value.calendar('jalali');
  const d = dayjs(value).calendar('jalali');
  return d.isValid() ? d : null;
}

/** پیش‌فرض: از یک هفته قبل تا امروز (شمسی). */
export function defaultFinanceDateRange() {
  const to = dayjs().calendar('jalali').endOf('day');
  const from = dayjs()
    .calendar('jalali')
    .subtract(DEFAULT_RANGE_DAYS_INCLUSIVE - 1, 'day')
    .startOf('day');
  return { from, to };
}

export function getDefaultFinanceFilters() {
  const { from, to } = defaultFinanceDateRange();
  return {
    branch_id: '',
    user_id: '',
    applicant_user_id: '',
    service_id: '',
    process_definition_key: '',
    process_instance_id: '',
    status: '',
    from,
    to,
  };
}

/** @param {unknown} value */
export function financeFilterToISO(value, boundary = 'start') {
  const d = jalaliDay(value);
  if (!d) return null;
  if (boundary === 'end') return d.endOf('day').toDate().toISOString();
  return d.startOf('day').toDate().toISOString();
}

export const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'همه' },
  { value: 'PAID', label: 'پرداخت شده' },
  { value: 'PENDING', label: 'در انتظار' },
  { value: 'REFUNDED', label: 'استرداد شده' },
];

export const PROCESS_DEFINITION_OPTIONS = [
  { value: '', label: 'همه فرایندها' },
  ...SERVICE_LABEL_OPTIONS,
];

const STATUS_LABEL_MAP = Object.fromEntries(
  PAYMENT_STATUS_OPTIONS.filter((s) => s.value).map((s) => [s.value, s.label])
);

const PROCESS_LABEL_MAP = Object.fromEntries(
  PROCESS_DEFINITION_OPTIONS.filter((p) => p.value).map((p) => [p.value, p.label])
);

export function paymentStatusLabel(status) {
  const key = String(status || '').toUpperCase();
  return STATUS_LABEL_MAP[key] ?? (status || '—');
}

export function processDefinitionLabel(key) {
  return PROCESS_LABEL_MAP[key] ?? (key || '—');
}

export function formatRial(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  return `${new Intl.NumberFormat('fa-IR').format(n)} ریال`;
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fa-IR');
}
