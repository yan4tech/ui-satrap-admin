import jsonata from 'jsonata';

export const DEFAULT_SAMPLE_ERROR_RESPONSE = {
  status_code: 400,
  body: {
    code: 'INVALID_NATIONAL_ID',
    message: 'national id format invalid',
  },
};

export const DEFAULT_ERROR_MAPPING_RULES = [
  {
    when: 'status_code >= 400',
    set: { gateway_approved: false },
    retry: false,
  },
  {
    when: "body.code = 'TEMP_UNAVAILABLE'",
    set: {},
    retry: true,
  },
];

/** @returns {{ when: string, set: Record<string, unknown>, retry: boolean }} */
export function emptyErrorMappingRule() {
  return { when: '', set: {}, retry: false };
}

/** @param {unknown} raw */
export function parseErrorMappingRules(raw) {
  let value = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [emptyErrorMappingRule()];
    value = JSON.parse(trimmed);
  }

  if (Array.isArray(value)) {
    return normalizeVisualRows(value);
  }

  if (value && typeof value === 'object') {
    return objectFormatToVisualRows(value);
  }

  return [emptyErrorMappingRule()];
}

/** @param {Array<{ when?: string, set?: Record<string, unknown>, retry?: boolean }>} rows */
export function buildErrorMappingJson(rows) {
  const normalized = normalizeVisualRows(rows).filter((row) => String(row.when ?? '').trim());
  if (!normalized.length) return null;

  return normalized.map((row) => {
    const item = {
      when: String(row.when).trim(),
      retry: Boolean(row.retry),
    };
    const set = row.set && typeof row.set === 'object' && !Array.isArray(row.set) ? row.set : {};
    if (Object.keys(set).length) item.set = set;
    return item;
  });
}

/** @param {Array<{ when?: string, set?: Record<string, unknown>, retry?: boolean }>} rows */
export function buildBackendErrorMappingObject(rows) {
  const out = {};
  normalizeVisualRows(rows).forEach((row) => {
    const key = whenToBackendKey(row.when);
    if (!key) return;
    const entry = {
      variables: row.set && typeof row.set === 'object' && !Array.isArray(row.set) ? row.set : {},
    };
    if (row.retry) entry.retry = true;
    out[key] = entry;
  });
  return Object.keys(out).length ? out : null;
}

/**
 * @param {Array<{ when?: string, set?: Record<string, unknown>, retry?: boolean }>} rules
 * @param {Record<string, unknown>} [sample]
 */
export async function previewErrorMapping(rules, sample = DEFAULT_SAMPLE_ERROR_RESPONSE) {
  const normalized = normalizeVisualRows(rules).filter((row) => String(row.when ?? '').trim());
  const context = buildErrorPreviewContext(sample);

  for (const rule of normalized) {
    const matched = await matchesErrorRule(rule.when, context);
    if (!matched) continue;
    return {
      matched: true,
      when: rule.when,
      set: rule.set ?? {},
      retry: Boolean(rule.retry),
    };
  }

  const backend = buildBackendErrorMappingObject(normalized);
  if (backend) {
    const backendMatch = matchBackendErrorMapping(backend, Number(context.status_code ?? 0));
    if (backendMatch) {
      return {
        matched: true,
        when: conditionKeyToWhen(backendMatch.key),
        set: backendMatch.variables,
        retry: backendMatch.retry,
      };
    }
  }

  return { matched: false, set: {}, retry: false };
}

export function formatErrorMappingJson(value) {
  const built = Array.isArray(value) ? value : buildErrorMappingJson(value);
  if (!built?.length) return '[]';
  return JSON.stringify(built, null, 2);
}

/** @param {unknown} text */
export function parseErrorMappingJsonText(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return [];
  const parsed = JSON.parse(trimmed);
  if (Array.isArray(parsed)) return normalizeVisualRows(parsed);
  if (parsed && typeof parsed === 'object') return objectFormatToVisualRows(parsed);
  throw new Error('error_mapping_json باید آرایه یا شیء JSON باشد');
}

/** @param {Record<string, unknown>} set */
export function formatSetVariables(set) {
  try {
    return JSON.stringify(set ?? {}, null, 2);
  } catch {
    return '{}';
  }
}

/** @param {string} text */
export function parseSetVariables(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed);
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Set variables باید یک شیء JSON باشد');
  }
  return parsed;
}

/** @param {unknown} raw */
function normalizeVisualRows(raw) {
  if (!Array.isArray(raw)) return [emptyErrorMappingRule()];
  const rows = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const set = item.set && typeof item.set === 'object' && !Array.isArray(item.set) ? item.set : {};
      return {
        when: String(item.when ?? '').trim(),
        set,
        retry: Boolean(item.retry),
      };
    })
    .filter(Boolean);
  return rows.length ? rows : [emptyErrorMappingRule()];
}

/** @param {Record<string, unknown>} obj */
function objectFormatToVisualRows(obj) {
  const rows = Object.entries(obj).map(([key, spec]) => {
    const rule = spec && typeof spec === 'object' && !Array.isArray(spec) ? spec : {};
    let set = {};
    if (rule.variables && typeof rule.variables === 'object' && !Array.isArray(rule.variables)) {
      set = rule.variables;
    } else if (rule.variable) {
      set = { [String(rule.variable)]: rule.value };
    }
    return {
      when: conditionKeyToWhen(key),
      set,
      retry: Boolean(rule.retry),
    };
  });
  return rows.length ? rows : [emptyErrorMappingRule()];
}

/** @param {unknown} key */
function conditionKeyToWhen(key) {
  const normalized = String(key ?? '').trim();
  if (!normalized || normalized === 'default') return 'true';
  if (/^\dxx$/i.test(normalized)) {
    const digit = Number(normalized[0]);
    if (Number.isFinite(digit)) {
      return `status_code >= ${digit * 100} && status_code < ${(digit + 1) * 100}`;
    }
  }
  if (/^\d+$/.test(normalized)) return `status_code = ${normalized}`;
  return normalized;
}

/** @param {unknown} when */
function whenToBackendKey(when) {
  const expr = String(when ?? '').trim();
  if (!expr || expr === 'true' || expr === 'default') return 'default';

  const exact = expr.match(/status_code\s*=\s*(\d{3})/i);
  if (exact) return exact[1];

  const classMatch = expr.match(/status_code\s*>=\s*(\d)xx/i);
  if (classMatch) return `${classMatch[1]}xx`;

  if (/status_code\s*>=\s*500/i.test(expr)) return '5xx';
  if (/status_code\s*>=\s*400/i.test(expr)) return '4xx';

  return null;
}

/** @param {Record<string, unknown>} sample */
function buildErrorPreviewContext(sample) {
  const body = sample?.body && typeof sample.body === 'object' && !Array.isArray(sample.body) ? sample.body : {};
  return {
    ...sample,
    status_code: Number(sample?.status_code ?? 400),
    body,
  };
}

/** @param {string} when @param {Record<string, unknown>} context */
async function matchesErrorRule(when, context) {
  const expr = String(when ?? '').trim();
  if (!expr) return false;
  if (expr === 'true' || expr === 'default') return true;
  try {
    const value = await jsonata(expr).evaluate(context);
    return Boolean(value);
  } catch {
    return false;
  }
}

/** @param {Record<string, { variables?: Record<string, unknown>, retry?: boolean }>} rules @param {number} statusCode */
function matchBackendErrorMapping(rules, statusCode) {
  const codeKey = String(statusCode);
  if (rules[codeKey]) {
    return { key: codeKey, variables: rules[codeKey].variables ?? {}, retry: Boolean(rules[codeKey].retry) };
  }
  const classKey = `${Math.floor(statusCode / 100)}xx`;
  if (rules[classKey]) {
    return { key: classKey, variables: rules[classKey].variables ?? {}, retry: Boolean(rules[classKey].retry) };
  }
  if (rules.default) {
    return { key: 'default', variables: rules.default.variables ?? {}, retry: Boolean(rules.default.retry) };
  }
  return null;
}
