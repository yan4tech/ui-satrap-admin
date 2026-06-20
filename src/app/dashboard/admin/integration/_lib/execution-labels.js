import dayjs from 'dayjs';
import jalaliday from 'jalaliday';

import { paths } from 'src/routes/paths';

dayjs.extend(jalaliday);
dayjs.calendar('jalali');
dayjs.locale('fa');

const DEFAULT_RANGE_DAYS_INCLUSIVE = 7;

const SENSITIVE_KEY_SUBSTRINGS = [
  'password',
  'token',
  'secret',
  'credential',
  'api_key',
  'apikey',
  'authorization',
  'auth',
];

/** @returns {import('dayjs').Dayjs} */
function jalaliDay(value) {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value.calendar('jalali');
  const d = dayjs(value).calendar('jalali');
  return d.isValid() ? d : null;
}

export function defaultExecutionDateRange() {
  const to = dayjs().calendar('jalali').endOf('day');
  const from = dayjs()
    .calendar('jalali')
    .subtract(DEFAULT_RANGE_DAYS_INCLUSIVE - 1, 'day')
    .startOf('day');
  return { from, to };
}

export function getDefaultExecutionFilters() {
  const { from, to } = defaultExecutionDateRange();
  return {
    process_id: '',
    status: '',
    action_id: '',
    from,
    to,
  };
}

/** @param {unknown} value */
export function executionFilterToISO(value, boundary = 'start') {
  const d = jalaliDay(value);
  if (!d) return null;
  if (boundary === 'end') return d.endOf('day').toDate().toISOString();
  return d.startOf('day').toDate().toISOString();
}

export const EXECUTION_STATUSES = [
  { value: '', label: 'همه' },
  { value: 'success', label: 'موفق' },
  { value: 'failed', label: 'ناموفق' },
  { value: 'waiting', label: 'در انتظار' },
  { value: 'retry', label: 'تلاش مجدد' },
];

export function executionStatusLabel(status) {
  return EXECUTION_STATUSES.find((s) => s.value === status)?.label ?? status ?? '—';
}

export function executionStatusChipColor(status) {
  switch (status) {
    case 'success':
      return 'success';
    case 'failed':
      return 'error';
    case 'waiting':
      return 'warning';
    case 'retry':
      return 'info';
    default:
      return 'default';
  }
}

export function formatExecutionDuration(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1000) return `${n} ms`;
  if (n < 60_000) return `${(n / 1000).toFixed(1)} s`;
  return `${(n / 60_000).toFixed(1)} min`;
}

export function formatExecutionDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fa-IR');
}

function isSensitiveKey(key) {
  const k = String(key ?? '').toLowerCase().trim();
  if (!k) return false;
  return SENSITIVE_KEY_SUBSTRINGS.some((sub) => k.includes(sub));
}

/** @param {unknown} value */
export function maskSensitiveValue(value) {
  if (value == null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => maskSensitiveValue(item));
  }
  if (typeof value === 'object') {
    /** @type {Record<string, unknown>} */
    const out = {};
    Object.entries(value).forEach(([k, v]) => {
      out[k] = isSensitiveKey(k) ? '[REDACTED]' : maskSensitiveValue(v);
    });
    return out;
  }
  return value;
}

/** @param {unknown} value */
export function formatExecutionMeta(value) {
  if (value == null || value === '') return null;
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return value;
    }
  }
  const masked = maskSensitiveValue(parsed);
  try {
    return JSON.stringify(masked, null, 2);
  } catch {
    return String(value);
  }
}

/** @param {unknown} value */
export function hasExecutionMeta(value) {
  if (value == null || value === '') return false;
  if (typeof value === 'string') return value.trim() !== '' && value.trim() !== '{}';
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

/**
 * لینک به صفحهٔ خدمت در UI موتور (همان الگوی صندوق کار).
 * @param {number|string|null|undefined} processInstanceId
 * @param {string|null|undefined} processKey
 */
export function buildEngineProcessHref(processInstanceId, processKey) {
  const pid = processInstanceId != null ? String(processInstanceId).trim() : '';
  if (!pid) return null;

  const def = String(processKey ?? 'service1').trim() || 'service1';
  const q = new URLSearchParams();
  q.set('processId', pid);
  q.set('definitionKey', def);

  let base = paths.dashboard.services.one;
  if (def === 'service2') base = paths.dashboard.services.two;
  else if (def === 'service3') base = paths.dashboard.services.three;
  else if (def === 'service4') base = paths.dashboard.services.four;

  return `${base}?${q.toString()}`;
}
