export const INTEGRATION_MODES = [
  { value: 'sync', label: 'Sync' },
  { value: 'async', label: 'Async' },
  { value: 'async_wait', label: 'Async wait' },
  { value: 'poll', label: 'Poll' },
];

export const DEFAULT_POLL_INTERVAL_SEC = 30;
export const DEFAULT_POLL_MAX_ATTEMPTS = 20;

const POLL_SUCCESS_KEYWORDS = ['APPROVED', 'SUCCESS', 'COMPLETED', 'DONE'];
const POLL_FAIL_KEYWORDS = ['REJECTED', 'FAILED', 'ERROR', 'CANCELLED'];

/** Integration output that drives exclusive gateway routing (sync gateway_condition hook). */
export const GATEWAY_DECISION_VARIABLE = '__gateway_decision__';

export const HOOK_TYPES = [
  { value: 'process_start', label: 'Process start' },
  { value: 'step_enter', label: 'Step enter' },
  { value: 'step_complete', label: 'Step complete' },
  { value: 'service_task', label: 'Service task' },
  {
    value: 'gateway_condition',
    label: 'Gateway condition',
    description:
      `Sync only. Bind to exclusive gateway step_id. Action output must set ${GATEWAY_DECISION_VARIABLE} to a branch id ("path_a", "path_b", matches flow condition or target) or boolean true (conditional branch) / false (default branch). Without binding, BPMN variable conditions apply.`,
  },
  { value: 'process_end', label: 'Process end' },
];

export function integrationModeLabel(mode) {
  return INTEGRATION_MODES.find((m) => m.value === mode)?.label ?? mode ?? '—';
}

export function hookTypeLabel(hookType) {
  return HOOK_TYPES.find((h) => h.value === hookType)?.label ?? hookType ?? '—';
}

export function hookTypeDescription(hookType) {
  return HOOK_TYPES.find((h) => h.value === hookType)?.description ?? '';
}

/** @param {unknown} raw */
export function parseBindingMapping(raw) {
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      obj = {};
    }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { input: {}, output: {}, poll: defaultPollConfig(), meta: {} };
  }
  return {
    input: obj.input && typeof obj.input === 'object' && !Array.isArray(obj.input) ? obj.input : {},
    output: obj.output && typeof obj.output === 'object' && !Array.isArray(obj.output) ? obj.output : {},
    poll: parsePollConfig(obj),
    meta: obj._meta && typeof obj._meta === 'object' && !Array.isArray(obj._meta) ? obj._meta : {},
  };
}

export function defaultPollConfig() {
  return {
    status_action_id: '',
    interval_sec: DEFAULT_POLL_INTERVAL_SEC,
    max_attempts: DEFAULT_POLL_MAX_ATTEMPTS,
    success_when: '',
    fail_when: '',
    terminal_statuses: '',
  };
}

/**
 * @param {unknown} mappingRoot
 * @returns {ReturnType<typeof defaultPollConfig>}
 */
export function parsePollConfig(mappingRoot) {
  const root = mappingRoot && typeof mappingRoot === 'object' && !Array.isArray(mappingRoot) ? mappingRoot : {};
  const poll = root.poll && typeof root.poll === 'object' && !Array.isArray(root.poll) ? root.poll : {};
  const meta = root._meta && typeof root._meta === 'object' && !Array.isArray(root._meta) ? root._meta : {};

  const statusActionId = poll.status_action_id ?? poll.action_id ?? '';
  const intervalSec = Number(poll.interval_sec);
  const maxAttempts = Number(poll.max_attempts);

  const config = {
    status_action_id: statusActionId === '' || statusActionId == null ? '' : statusActionId,
    interval_sec: intervalSec > 0 ? intervalSec : DEFAULT_POLL_INTERVAL_SEC,
    max_attempts: maxAttempts > 0 ? maxAttempts : DEFAULT_POLL_MAX_ATTEMPTS,
    success_when: String(poll.success_when ?? '').trim(),
    fail_when: String(poll.fail_when ?? '').trim(),
    terminal_statuses: '',
  };

  config.terminal_statuses = formatTerminalStatuses(config, meta);
  return config;
}

/** @param {ReturnType<typeof defaultPollConfig>} poll */
export function buildPollConfigJson(poll) {
  const statusActionId = poll?.status_action_id;
  if (statusActionId === '' || statusActionId == null) return null;

  const numericId = Number(statusActionId);
  const result = {
    status_action_id: Number.isFinite(numericId) && numericId > 0 ? numericId : String(statusActionId).trim(),
    interval_sec: Number(poll?.interval_sec) > 0 ? Number(poll.interval_sec) : DEFAULT_POLL_INTERVAL_SEC,
    max_attempts: Number(poll?.max_attempts) > 0 ? Number(poll.max_attempts) : DEFAULT_POLL_MAX_ATTEMPTS,
  };

  const expressions = resolvePollExpressions(poll);
  if (expressions.success_when) result.success_when = expressions.success_when;
  if (expressions.fail_when) result.fail_when = expressions.fail_when;
  return result;
}

/** @param {ReturnType<typeof defaultPollConfig>} poll */
export function buildPollMeta(poll) {
  const expressions = resolvePollExpressions(poll);
  const meta = { status_field: 'body.status' };
  const successValues = [];
  const failedValues = [];

  const successStatus = extractStatusFromExpression(expressions.success_when);
  const failStatus = extractStatusFromExpression(expressions.fail_when);
  if (successStatus) successValues.push(successStatus);
  if (failStatus) failedValues.push(failStatus);

  if (!successValues.length && !failedValues.length) {
    splitTerminalStatuses(poll?.terminal_statuses).forEach((status) => {
      const upper = status.toUpperCase();
      if (POLL_FAIL_KEYWORDS.some((k) => upper.includes(k))) {
        failedValues.push(status);
      } else if (POLL_SUCCESS_KEYWORDS.some((k) => upper.includes(k))) {
        successValues.push(status);
      }
    });
  }

  if (successValues.length) meta.success_values = successValues;
  if (failedValues.length) meta.failed_values = failedValues;
  return meta;
}

/**
 * @param {Record<string, unknown>} inputMapping
 * @param {Record<string, unknown>} outputMapping
 * @param {ReturnType<typeof defaultPollConfig>|null} [pollConfig]
 * @param {Record<string, unknown>} [existingMeta]
 */
export function buildBindingMappingJson(inputMapping, outputMapping, pollConfig = null, existingMeta = null) {
  const result = {
    input: inputMapping ?? {},
    output: outputMapping ?? {},
  };

  const poll = pollConfig ? buildPollConfigJson(pollConfig) : null;
  if (poll) {
    result.poll = poll;
    result._meta = {
      ...(existingMeta ?? {}),
      ...buildPollMeta(pollConfig),
    };
  }

  return result;
}

/** @param {ReturnType<typeof defaultPollConfig>} poll */
export function formatPollPreview(poll) {
  const interval = Number(poll?.interval_sec) > 0 ? Number(poll.interval_sec) : DEFAULT_POLL_INTERVAL_SEC;
  const attempts = Number(poll?.max_attempts) > 0 ? Number(poll.max_attempts) : DEFAULT_POLL_MAX_ATTEMPTS;
  return `Poll every ${interval}s, max ${attempts} attempts`;
}

/** @param {ReturnType<typeof defaultPollConfig>} poll */
export function validatePollConfig(poll) {
  if (!poll?.status_action_id) {
    throw new Error('برای mode=poll انتخاب status action الزامی است');
  }
  const interval = Number(poll.interval_sec);
  const attempts = Number(poll.max_attempts);
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new Error('interval_sec باید عدد مثبت باشد');
  }
  if (!Number.isFinite(attempts) || attempts <= 0) {
    throw new Error('max_attempts باید عدد مثبت باشد');
  }
}

export function formatOutputMappingJson(outputMapping) {
  try {
    return JSON.stringify(outputMapping ?? {}, null, 2);
  } catch {
    return '{}';
  }
}

/** @param {string} raw */
export function parseOutputMappingJson(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed);
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('output mapping باید یک شیء JSON باشد');
  }
  return parsed;
}

export function bindingLookupKey(stepId, hookType) {
  return `${stepId}::${hookType}`;
}

/** @param {ReturnType<typeof defaultPollConfig>} poll */
function resolvePollExpressions(poll) {
  let successWhen = String(poll?.success_when ?? '').trim();
  let failWhen = String(poll?.fail_when ?? '').trim();

  if (!successWhen || !failWhen) {
    const derived = deriveExpressionsFromTerminalStatuses(poll?.terminal_statuses);
    if (!successWhen && derived.success_when) successWhen = derived.success_when;
    if (!failWhen && derived.fail_when) failWhen = derived.fail_when;
  }

  return { success_when: successWhen, fail_when: failWhen };
}

/** @param {ReturnType<typeof defaultPollConfig>} poll @param {Record<string, unknown>} meta */
function formatTerminalStatuses(poll, meta) {
  const parts = [];
  const successStatus = extractStatusFromExpression(poll.success_when);
  const failStatus = extractStatusFromExpression(poll.fail_when);
  if (successStatus) parts.push(successStatus);
  if (failStatus) parts.push(failStatus);
  if (parts.length) return parts.join(',');

  const successValues = Array.isArray(meta?.success_values) ? meta.success_values : [];
  const failedValues = Array.isArray(meta?.failed_values) ? meta.failed_values : [];
  successValues.forEach((value) => {
    const status = String(value ?? '').trim();
    if (status) parts.push(status);
  });
  failedValues.forEach((value) => {
    const status = String(value ?? '').trim();
    if (status && !parts.includes(status)) parts.push(status);
  });
  return parts.join(',');
}

/** @param {unknown} text */
function splitTerminalStatuses(text) {
  return String(text ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/** @param {unknown} text */
function deriveExpressionsFromTerminalStatuses(text) {
  const result = { success_when: '', fail_when: '' };
  splitTerminalStatuses(text).forEach((status) => {
    const upper = status.toUpperCase();
    if (!result.fail_when && POLL_FAIL_KEYWORDS.some((k) => upper.includes(k))) {
      result.fail_when = `body.status = '${status}'`;
    } else if (!result.success_when && POLL_SUCCESS_KEYWORDS.some((k) => upper.includes(k))) {
      result.success_when = `body.status = '${status}'`;
    }
  });
  return result;
}

/** @param {unknown} expression */
function extractStatusFromExpression(expression) {
  const match = String(expression ?? '').match(/'([^']+)'/);
  return match ? match[1] : '';
}
