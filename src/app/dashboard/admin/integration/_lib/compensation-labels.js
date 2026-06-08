export const COMPENSATION_TRIGGERS = [
  {
    value: 'on_failure',
    label: 'در صورت خطا',
    description: 'پس از شکست اجرای integration در این مرحله، actionهای جبرانی اجرا می‌شوند.',
  },
  {
    value: 'on_process_cancel',
    label: 'لغو فرایند',
    description: 'هنگام لغو فرایند، actionهای جبرانی بدون شرط اجرا می‌شوند.',
  },
];

export const CONDITION_MODES = [
  { value: 'none', label: 'بدون شرط' },
  { value: 'simple', label: 'عبارت JSONata' },
  { value: 'json', label: 'JSON خام' },
];

export function compensationTriggerLabel(trigger) {
  return COMPENSATION_TRIGGERS.find((t) => t.value === trigger)?.label ?? trigger ?? '—';
}

export function compensationTriggerDescription(trigger) {
  return COMPENSATION_TRIGGERS.find((t) => t.value === trigger)?.description ?? '';
}

export function conditionModeLabel(mode) {
  return CONDITION_MODES.find((m) => m.value === mode)?.label ?? mode ?? '—';
}

/** @param {unknown} raw */
export function parseCompensationConfig(raw) {
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      obj = {};
    }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { on_failure: [], on_process_cancel: [] };
  }

  const normalizeList = (list) => {
    if (!Array.isArray(list)) return [];
    return list
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const actionId = Number(item.action_id ?? item.ActionID ?? 0);
        if (!actionId) return null;
        return {
          action_id: actionId,
          condition_json: item.condition_json ?? item.ConditionJSON ?? undefined,
        };
      })
      .filter(Boolean);
  };

  return {
    on_failure: normalizeList(obj.on_failure),
    on_process_cancel: normalizeList(obj.on_process_cancel),
  };
}

/**
 * @param {{ on_failure?: Array<{ action_id: number, condition_json?: unknown }>, on_process_cancel?: Array<{ action_id: number }> }} config
 */
export function buildCompensationJson(config) {
  const result = {};

  const buildList = (list, withCondition) => {
    if (!Array.isArray(list) || !list.length) return undefined;
    const items = list
      .map((row) => {
        const actionId = Number(row?.action_id ?? 0);
        if (!actionId) return null;
        const item = { action_id: actionId };
        if (withCondition) {
          const condition = buildConditionJson(row);
          if (condition !== undefined) {
            item.condition_json = condition;
          }
        }
        return item;
      })
      .filter(Boolean);
    return items.length ? items : undefined;
  };

  const onFailure = buildList(config?.on_failure, true);
  const onCancel = buildList(config?.on_process_cancel, false);
  if (onFailure) result.on_failure = onFailure;
  if (onCancel) result.on_process_cancel = onCancel;
  return result;
}

/** @param {unknown} conditionJson */
export function parseConditionForEditor(conditionJson) {
  if (conditionJson == null || conditionJson === '') {
    return { mode: 'none', expr: '', jsonText: '' };
  }

  if (typeof conditionJson === 'string') {
    const trimmed = conditionJson.trim();
    if (!trimmed) return { mode: 'none', expr: '', jsonText: '' };
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'string') {
        return { mode: 'simple', expr: parsed, jsonText: '' };
      }
      if (parsed && typeof parsed === 'object' && typeof parsed.expr === 'string') {
        return { mode: 'simple', expr: parsed.expr, jsonText: '' };
      }
      return { mode: 'json', expr: '', jsonText: JSON.stringify(parsed, null, 2) };
    } catch {
      return { mode: 'simple', expr: conditionJson, jsonText: '' };
    }
  }

  if (typeof conditionJson === 'object') {
    if (typeof conditionJson.expr === 'string' && conditionJson.expr.trim()) {
      return { mode: 'simple', expr: conditionJson.expr, jsonText: '' };
    }
    try {
      return { mode: 'json', expr: '', jsonText: JSON.stringify(conditionJson, null, 2) };
    } catch {
      return { mode: 'json', expr: '', jsonText: '{}' };
    }
  }

  return { mode: 'none', expr: '', jsonText: '' };
}

/**
 * @param {{ mode?: string, expr?: string, jsonText?: string, condition_json?: unknown }} row
 */
export function buildConditionJson(row) {
  if (row?.condition_json !== undefined) {
    return normalizeConditionValue(row.condition_json);
  }

  const mode = row?.mode ?? 'none';
  if (mode === 'none') return undefined;

  if (mode === 'simple') {
    const expr = String(row?.expr ?? '').trim();
    if (!expr) return undefined;
    return expr;
  }

  const text = String(row?.jsonText ?? '').trim();
  if (!text) return undefined;
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('condition_json باید JSON معتبر باشد');
  }
  return normalizeConditionValue(parsed);
}

/** @param {unknown} value */
function normalizeConditionValue(value) {
  if (value == null || value === '') return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  return value;
}

export function compensationConfigIsEmpty(config) {
  const parsed = parseCompensationConfig(config);
  return parsed.on_failure.length === 0 && parsed.on_process_cancel.length === 0;
}

export function formatCompensationJson(config) {
  try {
    return JSON.stringify(buildCompensationJson(config), null, 2);
  } catch {
    return '{}';
  }
}
