import jsonata from 'jsonata';

import { DEFAULT_WEBHOOK_TEST_PAYLOAD } from './webhook-labels';
import { normalizeMappingExpression } from './mapping-preview';

export { DEFAULT_WEBHOOK_TEST_PAYLOAD as DEFAULT_INBOUND_SAMPLE_PAYLOAD };

/** @returns {{ mapping: Record<string, string>, meta: { correlation_path: string, status_field: string } }} */
export function emptyInboundMappingState() {
  return {
    mapping: {},
    meta: {
      correlation_path: '',
      status_field: '',
    },
  };
}

/** @param {unknown} raw */
export function parseInboundMapping(raw) {
  let obj = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return emptyInboundMappingState();
    obj = JSON.parse(trimmed);
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return emptyInboundMappingState();
  }

  const metaRaw = obj._meta && typeof obj._meta === 'object' && !Array.isArray(obj._meta) ? obj._meta : {};
  const mapping = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (key === '_meta') return;
    if (value == null) return;
    mapping[key] = String(value);
  });

  return {
    mapping,
    meta: {
      correlation_path: String(metaRaw.correlation_path ?? metaRaw.correlation_id_field ?? '').trim(),
      status_field: String(metaRaw.status_field ?? '').trim(),
    },
  };
}

/**
 * @param {Record<string, string>} mapping
 * @param {{ correlation_path?: string, status_field?: string }} meta
 */
export function buildInboundMappingJson(mapping, meta = {}) {
  const result = {};
  const normalizedMeta = normalizeInboundMeta(meta);

  Object.entries(mapping ?? {}).forEach(([expr, target]) => {
    const source = String(expr ?? '').trim();
    const dest = String(target ?? '').trim();
    if (source && dest) result[source] = dest;
  });

  if (Object.keys(normalizedMeta).length) {
    result._meta = normalizedMeta;
  }

  return Object.keys(result).length ? result : null;
}

/** @param {{ correlation_path?: string, status_field?: string }} meta */
function normalizeInboundMeta(meta) {
  const out = {};
  const correlationPath = String(meta?.correlation_path ?? '').trim();
  const statusField = String(meta?.status_field ?? '').trim();
  if (correlationPath) out.correlation_id_field = correlationPath;
  if (statusField) out.status_field = statusField;
  return out;
}

export function formatInboundMappingJson(value) {
  if (!value) return '{}';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '{}';
  }
}

/** @param {string} text */
export function parseInboundMappingJsonText(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return null;
  const parsed = JSON.parse(trimmed);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('inbound_mapping_json باید یک شیء JSON باشد');
  }
  return parsed;
}

/**
 * Mirrors gateway mapper.ApplyInboundMapping on a webhook payload.
 * @param {Record<string, string>} mapping
 * @param {Record<string, unknown>} samplePayload
 */
export async function previewInboundMapping(mapping, samplePayload = DEFAULT_WEBHOOK_TEST_PAYLOAD) {
  const payload =
    samplePayload && typeof samplePayload === 'object' && !Array.isArray(samplePayload)
      ? samplePayload
      : DEFAULT_WEBHOOK_TEST_PAYLOAD;

  const mapped = {};
  for (const [sourceExpr, targetRaw] of Object.entries(mapping ?? {})) {
    const target = String(targetRaw ?? '').trim();
    if (!target) continue;
    const expr = normalizeMappingExpression(sourceExpr);
    if (!expr) {
      mapped[target] = null;
      continue;
    }
    try {
      mapped[target] = await jsonata(expr).evaluate(payload);
    } catch (error) {
      throw new Error(`عبارت «${sourceExpr}»: ${error?.message || 'خطای JSONata'}`);
    }
  }
  return mapped;
}

/**
 * @param {Record<string, unknown>} mapped
 * @param {Record<string, unknown>} payload
 * @param {{ correlation_path?: string }} meta
 */
export async function extractInboundCorrelationId(mapped, payload, meta = {}) {
  const fromMapped = stringValue(mapped?.correlation_id);
  if (fromMapped) return fromMapped;

  const fromPayload = stringValue(payload?.correlation_id);
  if (fromPayload) return fromPayload;

  const field = String(meta?.correlation_path ?? '').trim();
  if (!field) return '';

  try {
    const value = await jsonata(normalizeMappingExpression(field)).evaluate(payload);
    return stringValue(value);
  } catch {
    return '';
  }
}

/**
 * @param {Record<string, string>} mapping
 * @param {{ correlation_path?: string, status_field?: string }} meta
 * @param {Record<string, unknown>} samplePayload
 */
export async function previewInboundResume(mapping, meta, samplePayload = DEFAULT_WEBHOOK_TEST_PAYLOAD) {
  const mapped = await previewInboundMapping(mapping, samplePayload);
  const correlationId = await extractInboundCorrelationId(mapped, samplePayload, meta);
  return { mapped, correlation_id: correlationId };
}

/** @returns {{ expression: string, variable: string }} */
export function emptyInboundMappingRow() {
  return { expression: '', variable: '' };
}

/** @param {Record<string, string>} mapping */
export function inboundMappingToRows(mapping) {
  const entries = Object.entries(mapping ?? {}).filter(([expr, variable]) => expr && variable);
  if (!entries.length) return [emptyInboundMappingRow()];
  return entries.map(([expression, variable]) => ({ expression, variable }));
}

/** @param {Array<{ expression?: string, variable?: string }>} rows */
export function rowsToInboundMapping(rows) {
  const mapping = {};
  (rows ?? []).forEach((row) => {
    const expression = String(row?.expression ?? '').trim();
    const variable = String(row?.variable ?? '').trim();
    if (expression && variable) mapping[expression] = variable;
  });
  return mapping;
}

/** @param {unknown} value */
function stringValue(value) {
  if (value == null) return '';
  return String(value).trim();
}
