import jsonata from 'jsonata';

/** @param {string} expr */
export function normalizeMappingExpression(expr) {
  const raw = String(expr ?? '').trim();
  if (raw.startsWith('{{') && raw.endsWith('}}')) {
    return raw.slice(2, -2).trim();
  }
  return raw;
}

/**
 * @param {{
 *   instanceId?: number,
 *   processKey?: string,
 *   stepId?: string,
 *   variables?: Record<string, unknown>,
 *   env?: Record<string, string>,
 * }} ctx
 */
export function buildMappingEvalRoot(ctx = {}) {
  const variables = ctx.variables && typeof ctx.variables === 'object' ? ctx.variables : {};
  const env = ctx.env && typeof ctx.env === 'object' ? ctx.env : {};
  const envOut = {};
  Object.entries(env).forEach(([k, v]) => {
    envOut[k] = v;
  });

  return {
    instance: {
      id: ctx.instanceId ?? 1,
      process_key: ctx.processKey ?? 'service1',
      variables,
    },
    step_id: ctx.stepId ?? 'step1',
    env: envOut,
  };
}

/**
 * Mirrors gateway mapper.ApplyInputMapping for flat field→expression maps.
 * @param {Record<string, string>} mapping
 * @param {ReturnType<typeof buildMappingEvalRoot>} root
 */
export async function previewInputMapping(mapping, root) {
  const payload = {};
  const entries = Object.entries(mapping ?? {});

  for (const [field, spec] of entries) {
    if (typeof spec !== 'string') {
      payload[field] = spec;
      continue;
    }
    const expr = normalizeMappingExpression(spec);
    if (!expr) {
      payload[field] = '';
      continue;
    }
    try {
      payload[field] = await jsonata(expr).evaluate(root);
    } catch (error) {
      throw new Error(`فیلد «${field}»: ${error?.message || 'خطای JSONata'}`);
    }
  }

  return payload;
}

/** @param {unknown} raw */
export function parseSampleVariables(raw) {
  if (raw == null || raw === '') return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  const parsed = JSON.parse(String(raw));
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('متغیرهای نمونه باید یک شیء JSON باشند');
  }
  return parsed;
}

export function formatMappingJson(value) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '{}';
  }
}

/** @param {string} raw */
export function parseMappingJson(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed);
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('mapping باید یک شیء JSON باشد');
  }
  return parsed;
}
