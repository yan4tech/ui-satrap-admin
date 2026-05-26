import dayjs from 'dayjs';

/** @returns {import('dayjs').Dayjs | null} */
function parseFilterDay(value) {
  if (!value) return null;
  const d = dayjs.isDayjs(value) ? value : dayjs(value);
  return d.isValid() ? d : null;
}

/** پیش‌فرض: امروز (شمسی — همان تقویم سراسری تم). */
export function defaultFinanceDateRange() {
  const today = dayjs().startOf('day');
  return { from: today, to: today };
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
  const d = parseFilterDay(value);
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
  { value: 'service1', label: 'خدمت شماره یک' },
  { value: 'service2', label: 'خدمت شماره دو' },
  { value: 'service3', label: 'خدمت شماره سه' },
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
