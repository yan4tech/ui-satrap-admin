/** @typedef {'rest'|'sql'|'notification'|'script'|'generic'} ActionFormKind */

export const REST_HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const SQL_OPERATIONS = [
  { value: 'query', label: 'Query' },
  { value: 'exec', label: 'Exec' },
  { value: 'stored_proc', label: 'Stored procedure' },
];

export const NOTIFICATION_SUBTYPES = [
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'otp', label: 'OTP' },
  { value: 'push', label: 'Push' },
];

/** @param {string} connectorType */
export function resolveActionFormKind(connectorType) {
  switch (String(connectorType ?? '').toLowerCase()) {
    case 'rest':
      return 'rest';
    case 'sql':
      return 'sql';
    case 'notification':
      return 'notification';
    case 'script':
      return 'script';
    default:
      return 'generic';
  }
}

function parseJsonObject(raw, fieldLabel) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed);
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${fieldLabel} باید یک شیء JSON باشد`);
  }
  return parsed;
}

/** @param {string} raw @param {string} fieldLabel */
export function parseJsonSchemaInput(raw, fieldLabel) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return null;
  const parsed = JSON.parse(trimmed);
  if (parsed == null || typeof parsed !== 'object') {
    throw new Error(`${fieldLabel} باید JSON Schema معتبر باشد`);
  }
  return parsed;
}

/**
 * @param {ActionFormKind} kind
 * @param {Record<string, unknown>} values
 */
export function buildActionConfigJson(kind, values) {
  switch (kind) {
    case 'rest': {
      const headers = parseJsonObject(values.rest_headers, 'headers');
      const timeout = Number(values.rest_timeout);
      const config = {
        method: String(values.rest_method ?? 'POST').toUpperCase(),
        path: String(values.rest_path ?? '').trim(),
        headers,
      };
      if (Number.isFinite(timeout) && timeout > 0) {
        config.timeout_ms = timeout;
      }
      return config;
    }
    case 'sql':
      return {
        operation: String(values.sql_operation ?? 'query').toLowerCase(),
        sql: String(values.sql_template ?? '').trim(),
        params: parseJsonObject(values.sql_params, 'params'),
      };
    case 'notification': {
      const config = {
        subtype: String(values.notif_subtype ?? 'sms').toLowerCase(),
      };
      const template = String(values.notif_template ?? '').trim();
      if (template) config.template = template;
      return config;
    }
    case 'script': {
      const config = { entry: String(values.script_entry ?? 'transform').trim() || 'transform' };
      const wasmBase64 = String(values.script_wasm_base64 ?? '').trim();
      const wasmRef = String(values.script_wasm_ref ?? '').trim();
      if (wasmBase64) config.wasm_base64 = wasmBase64;
      if (wasmRef) config.wasm_ref = wasmRef;
      return config;
    }
    default:
      return parseJsonObject(values.generic_config_json, 'config_json');
  }
}

/**
 * @param {ActionFormKind} kind
 * @param {Record<string, unknown>} config
 */
export function actionConfigToFormValues(kind, config) {
  const cfg = config && typeof config === 'object' ? config : {};

  switch (kind) {
    case 'rest':
      return {
        rest_method: String(cfg.method ?? 'POST').toUpperCase(),
        rest_path: String(cfg.path ?? ''),
        rest_headers: JSON.stringify(cfg.headers ?? {}, null, 2),
        rest_timeout: cfg.timeout_ms != null ? String(cfg.timeout_ms) : '',
      };
    case 'sql':
      return {
        sql_operation: String(cfg.operation ?? 'query'),
        sql_template: String(cfg.sql ?? ''),
        sql_params: JSON.stringify(cfg.params ?? {}, null, 2),
      };
    case 'notification':
      return {
        notif_subtype: String(cfg.subtype ?? 'sms'),
        notif_template: String(cfg.template ?? cfg.template_id ?? cfg.templateId ?? ''),
      };
    case 'script':
      return {
        script_entry: String(cfg.entry ?? 'transform'),
        script_wasm_base64: String(cfg.wasm_base64 ?? ''),
        script_wasm_ref: String(cfg.wasm_ref ?? ''),
      };
    default:
      return {
        generic_config_json: JSON.stringify(cfg, null, 2),
      };
  }
}

export function defaultActionFormValues(kind) {
  return {
    name: '',
    action_key: '',
    input_schema_json: '{\n  "type": "object",\n  "properties": {}\n}',
    output_schema_json: '{\n  "type": "object",\n  "properties": {}\n}',
    ...actionConfigToFormValues(kind, {}),
  };
}

export const jsonEditorSlotProps = {
  input: {
    sx: {
      fontFamily: 'monospace',
      direction: 'ltr',
      textAlign: 'left',
    },
  },
};
