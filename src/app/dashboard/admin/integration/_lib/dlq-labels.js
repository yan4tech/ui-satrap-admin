import { formatExecutionDateTime, formatExecutionMeta } from './execution-labels';

export function getDefaultDlqFilters() {
  return {
    process_key: '',
    correlation_id: '',
    resolved: 'false',
  };
}

export function formatDlqDateTime(value) {
  return formatExecutionDateTime(value);
}

/** @param {unknown} payload */
export function parseDlqPayload(payload) {
  if (payload == null || payload === '') return null;
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
  if (typeof payload === 'object') return payload;
  return null;
}

/** @param {unknown} payload */
export function extractDlqRequestFields(payload) {
  const root = parseDlqPayload(payload);
  const request = root?.request ?? root?.Request ?? {};
  return {
    process_key: String(request.process_key ?? request.ProcessKey ?? ''),
    process_instance_id: Number(request.process_instance_id ?? request.ProcessInstanceID ?? 0),
    step_id: String(request.step_id ?? request.StepID ?? ''),
    action_id: String(request.action_id ?? request.ActionID ?? ''),
    mode: String(request.mode ?? request.Mode ?? ''),
    retry_count: Number(root?.retry_count ?? root?.RetryCount ?? 0),
    max_retry: Number(root?.max_retry ?? root?.MaxRetry ?? 0),
  };
}

/** @param {unknown} payload */
export function formatDlqPayload(payload) {
  return formatExecutionMeta(payload);
}

export function truncateDlqError(error, maxLen = 80) {
  const text = String(error ?? '').trim();
  if (!text) return '—';
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}
