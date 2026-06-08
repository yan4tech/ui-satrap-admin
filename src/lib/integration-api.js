import { ENGINE_BASE_URL, jsonHeaders } from 'src/app/dashboard/services/one/engine-api';

const GATEWAY_BASE_RAW =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GATEWAY_URL?.trim()) || 'http://localhost';

/** پایهٔ Traefik یا gateway مستقیم؛ با `NEXT_PUBLIC_GATEWAY_URL` قابل تنظیم است */
export const GATEWAY_BASE_URL = GATEWAY_BASE_RAW.replace(/\/+$/, '');

/**
 * Traefik (http://localhost): /api/gateway/api/integration — stripPrefix → /api/integration
 * Gateway مستقیم (http://localhost:3500): /api/integration
 */
export function integrationApiBase() {
  try {
    const { port, hostname } = new URL(GATEWAY_BASE_URL);
    const viaTraefik =
      (port === '' || port === '80' || port === '443') &&
      (hostname === 'localhost' || hostname === '127.0.0.1');
    return viaTraefik
      ? `${GATEWAY_BASE_URL}/api/gateway/api/integration`
      : `${GATEWAY_BASE_URL}/api/integration`;
  } catch {
    return `${GATEWAY_BASE_URL}/api/gateway/api/integration`;
  }
}

const INTEGRATION_API = integrationApiBase();

function unwrapData(envelope) {
  const root = envelope && typeof envelope === 'object' ? envelope : {};
  return root.data !== undefined ? root.data : root;
}

function extractErrorMessage(data, fallback) {
  if (typeof data?.message === 'string' && data.message) return data.message;
  if (typeof data?.error === 'string' && data.error) return data.error;
  return fallback;
}

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function integrationRequest(path, { method = 'GET', body, params } = {}) {
  const url = new URL(`${INTEGRATION_API}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  let res;
  try {
    res = await fetch(url.toString(), {
      method,
      headers: jsonHeaders(),
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error(
      `اتصال به سرویس یکپارچه‌سازی برقرار نشد (${GATEWAY_BASE_URL}). ${e?.message || ''}`.trim()
    );
  }

  const json = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractErrorMessage(json, `درخواست ناموفق بود (${res.status})`));
  }
  if (json && Object.prototype.hasOwnProperty.call(json, 'status') && json.status !== 'success') {
    throw new Error(extractErrorMessage(json, 'عملیات ناموفق بود'));
  }
  return json;
}

/** @param {Record<string, unknown>} item */
export function normalizeConnector(item) {
  if (!item || typeof item !== 'object') return null;
  const id = item.id ?? item.ID;
  if (id == null) return null;

  let configJson = item.config_json ?? item.ConfigJSON ?? {};
  if (typeof configJson === 'string') {
    try {
      configJson = JSON.parse(configJson);
    } catch {
      configJson = {};
    }
  }

  return {
    id: Number(id),
    name: String(item.name ?? item.Name ?? ''),
    type: String(item.type ?? item.Type ?? ''),
    config_json: configJson,
    credential_ref: String(item.credential_ref ?? item.CredentialRef ?? ''),
    tenant_id: String(item.tenant_id ?? item.TenantID ?? ''),
    version: Number(item.version ?? item.Version ?? 1),
    is_active: Boolean(item.is_active ?? item.IsActive ?? true),
    created_at: item.created_at ?? item.CreatedAt ?? null,
    updated_at: item.updated_at ?? item.UpdatedAt ?? null,
  };
}

export const CONNECTOR_TYPES = [
  { value: 'rest', label: 'REST' },
  { value: 'sql', label: 'SQL' },
  { value: 'notification', label: 'Notification' },
  { value: 'script', label: 'Script (WASM)' },
];

export function connectorTypeLabel(type) {
  const found = CONNECTOR_TYPES.find((t) => t.value === type);
  return found?.label ?? type ?? '—';
}

export function formatConfigJson(value) {
  if (value == null || value === '') return '{}';
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '{}';
  }
}

export function parseConfigJsonInput(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed);
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('config_json باید یک شیء JSON باشد');
  }
  return parsed;
}

/**
 * @param {{ offset?: number, limit?: number, isActive?: boolean|null }} [opts]
 */
export async function listConnectors(opts = {}) {
  const { offset = 0, limit = 25, isActive = null } = opts;
  const params = { offset, limit };
  if (isActive !== null && isActive !== undefined && isActive !== '') {
    params.is_active = isActive;
  }

  const json = await integrationRequest('/connectors', { params });
  const data = unwrapData(json);
  const rawItems = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  const items = rawItems.map(normalizeConnector).filter(Boolean);
  return {
    items,
    total: Number(data?.total ?? items.length),
  };
}

export async function getConnector(id) {
  const json = await integrationRequest(`/connectors/${id}`);
  return normalizeConnector(unwrapData(json));
}

/**
 * @param {{ name: string, type: string, config_json?: object, credential_ref?: string, tenant_id?: string }} payload
 */
export async function createConnector(payload) {
  const json = await integrationRequest('/connectors', {
    method: 'POST',
    body: {
      name: payload.name,
      type: payload.type,
      config_json: payload.config_json ?? {},
      credential_ref: payload.credential_ref ?? '',
      tenant_id: payload.tenant_id ?? '',
    },
  });
  return normalizeConnector(unwrapData(json));
}

/**
 * @param {number|string} id
 * @param {Record<string, unknown>} payload
 */
export async function updateConnector(id, payload) {
  const json = await integrationRequest(`/connectors/${id}`, {
    method: 'PUT',
    body: payload,
  });
  return normalizeConnector(unwrapData(json));
}

/** غیرفعال‌سازی نرم (is_active=false) */
export async function deleteConnector(id) {
  await integrationRequest(`/connectors/${id}`, { method: 'DELETE' });
}

/** @param {Record<string, unknown>} item */
export function normalizeCredentialRef(item) {
  if (!item || typeof item !== 'object') return null;
  const id = item.id ?? item.ID;
  if (id == null) return null;

  const vaultPath = String(item.vault_path ?? item.VaultPath ?? '').trim();
  const type = vaultPath ? 'vault' : 'env';

  return {
    id: Number(id),
    ref: String(item.ref ?? item.Ref ?? ''),
    env_prefix: String(item.env_prefix ?? item.EnvPrefix ?? ''),
    vault_path: vaultPath,
    description: String(item.description ?? item.Description ?? ''),
    type,
    created_at: item.created_at ?? item.CreatedAt ?? null,
    updated_at: item.updated_at ?? item.UpdatedAt ?? null,
  };
}

export function credentialRefTypeLabel(type) {
  if (type === 'vault') return 'Vault';
  if (type === 'env') return 'Env';
  return type ?? '—';
}

/**
 * @param {{ offset?: number, limit?: number }} [opts]
 */
export async function listCredentialRefs(opts = {}) {
  const { offset = 0, limit = 100 } = opts;
  const json = await integrationRequest('/credential-refs', { params: { offset, limit } });
  const data = unwrapData(json);
  const rawItems = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  const items = rawItems.map(normalizeCredentialRef).filter(Boolean);
  return {
    items,
    total: Number(data?.total ?? items.length),
  };
}

export async function getCredentialRef(id) {
  const json = await integrationRequest(`/credential-refs/${id}`);
  return normalizeCredentialRef(unwrapData(json));
}

/**
 * @param {{ ref: string, env_prefix: string, vault_path?: string, description?: string }} payload
 */
export async function createCredentialRef(payload) {
  const json = await integrationRequest('/credential-refs', {
    method: 'POST',
    body: {
      ref: payload.ref,
      env_prefix: payload.env_prefix,
      vault_path: payload.vault_path ?? '',
      description: payload.description ?? '',
    },
  });
  return normalizeCredentialRef(unwrapData(json));
}

/**
 * @param {number|string} id
 * @param {Record<string, unknown>} payload
 */
export async function updateCredentialRef(id, payload) {
  const json = await integrationRequest(`/credential-refs/${id}`, {
    method: 'PUT',
    body: payload,
  });
  return normalizeCredentialRef(unwrapData(json));
}

export async function deleteCredentialRef(id) {
  await integrationRequest(`/credential-refs/${id}`, { method: 'DELETE' });
}

export async function testConnector(id) {
  const json = await integrationRequest(`/connectors/${id}/test`, { method: 'POST' });
  const data = unwrapData(json);
  return {
    status: String(data?.status ?? ''),
    latency_ms: Number(data?.latency_ms ?? data?.latencyMs ?? 0),
    message: String(data?.message ?? ''),
  };
}

export async function listIntegrationActions(connectorId) {
  const json = await integrationRequest('/actions', {
    params: { connector_id: connectorId },
  });
  const data = unwrapData(json);
  const raw = Array.isArray(data) ? data : [];
  return raw.map(normalizeIntegrationAction).filter(Boolean);
}

/** @param {Record<string, unknown>} item */
export function normalizeIntegrationAction(item) {
  if (!item || typeof item !== 'object') return null;
  const id = item.id ?? item.ID;
  if (id == null) return null;

  const parseJsonField = (value) => {
    if (value == null || value === '') return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  };

  return {
    id: Number(id),
    connector_id: Number(item.connector_id ?? item.ConnectorID ?? 0),
    name: String(item.name ?? item.Name ?? ''),
    action_key: String(item.action_key ?? item.ActionKey ?? ''),
    config_json: parseJsonField(item.config_json ?? item.ConfigJSON) ?? {},
    input_schema_json: parseJsonField(item.input_schema_json ?? item.InputSchemaJSON),
    output_schema_json: parseJsonField(item.output_schema_json ?? item.OutputSchemaJSON),
    error_mapping_json: parseJsonField(item.error_mapping_json ?? item.ErrorMappingJSON),
    inbound_mapping_json: parseJsonField(item.inbound_mapping_json ?? item.InboundMappingJSON) ?? null,
    created_at: item.created_at ?? item.CreatedAt ?? null,
  };
}

export async function getIntegrationAction(id) {
  const json = await integrationRequest(`/actions/${id}`);
  return normalizeIntegrationAction(unwrapData(json));
}

/**
 * @param {{
 *   connector_id: number,
 *   name: string,
 *   action_key: string,
 *   config_json?: object,
 *   input_schema_json?: object|null,
 *   output_schema_json?: object|null,
 *   error_mapping_json?: object|null,
 *   inbound_mapping_json?: object|null,
 * }} payload
 */
export async function createIntegrationAction(payload) {
  const body = {
    connector_id: payload.connector_id,
    name: payload.name,
    action_key: payload.action_key,
    config_json: payload.config_json ?? {},
  };
  if (payload.input_schema_json) body.input_schema_json = payload.input_schema_json;
  if (payload.output_schema_json) body.output_schema_json = payload.output_schema_json;
  if (payload.error_mapping_json) body.error_mapping_json = payload.error_mapping_json;
  if (payload.inbound_mapping_json) body.inbound_mapping_json = payload.inbound_mapping_json;

  const json = await integrationRequest('/actions', { method: 'POST', body });
  return normalizeIntegrationAction(unwrapData(json));
}

/**
 * @param {number|string} id
 * @param {Record<string, unknown>} payload
 */
export async function updateIntegrationAction(id, payload) {
  const json = await integrationRequest(`/actions/${id}`, {
    method: 'PUT',
    body: payload,
  });
  return normalizeIntegrationAction(unwrapData(json));
}

export async function deleteIntegrationAction(id) {
  await integrationRequest(`/actions/${id}`, { method: 'DELETE' });
}

/** @param {ReturnType<typeof normalizeConnector>[]} connectors */
export async function attachActionCounts(connectors) {
  if (!connectors?.length) return [];
  const enriched = await Promise.all(
    connectors.map(async (connector) => {
      try {
        const actions = await listIntegrationActions(connector.id);
        return { ...connector, actions_count: actions.length };
      } catch {
        return { ...connector, actions_count: 0 };
      }
    })
  );
  return enriched;
}

/** @param {Record<string, unknown>} item */
export function normalizeProcessBinding(item) {
  if (!item || typeof item !== 'object') return null;
  const id = item.id ?? item.ID;
  if (id == null) return null;

  const parseJsonField = (value) => {
    if (value == null || value === '') return {};
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return value;
  };

  return {
    id: Number(id),
    process_key: String(item.process_key ?? item.ProcessKey ?? ''),
    step_id: String(item.step_id ?? item.StepID ?? ''),
    hook_type: String(item.hook_type ?? item.HookType ?? ''),
    action_id: Number(item.action_id ?? item.ActionID ?? 0),
    mapping_json: parseJsonField(item.mapping_json ?? item.MappingJSON),
    compensation_json: parseJsonField(item.compensation_json ?? item.CompensationJSON),
    mode: String(item.mode ?? item.Mode ?? 'sync'),
    is_active: Boolean(item.is_active ?? item.IsActive ?? true),
    version: Number(item.version ?? item.Version ?? 1),
  };
}

export async function listProcessBindings(processKey, { isActive = null } = {}) {
  const params = { process_key: processKey };
  if (isActive !== null && isActive !== undefined && isActive !== '') {
    params.is_active = isActive;
  }
  const json = await integrationRequest('/process-bindings', { params });
  const data = unwrapData(json);
  const rawItems = Array.isArray(data?.items) ? data.items : [];
  return {
    items: rawItems.map(normalizeProcessBinding).filter(Boolean),
    total: Number(data?.total ?? rawItems.length),
  };
}

/**
 * @param {{
 *   process_key: string,
 *   step_id: string,
 *   hook_type: string,
 *   action_id: number,
 *   mode: string,
 *   mapping_json?: object,
 *   is_active?: boolean,
 * }} payload
 */
export async function createProcessBinding(payload) {
  const json = await integrationRequest('/process-bindings', {
    method: 'POST',
    body: payload,
  });
  return normalizeProcessBinding(unwrapData(json));
}

/**
 * @param {number|string} id
 * @param {Record<string, unknown>} payload
 */
export async function updateProcessBinding(id, payload) {
  const json = await integrationRequest(`/process-bindings/${id}`, {
    method: 'PUT',
    body: payload,
  });
  return normalizeProcessBinding(unwrapData(json));
}

export async function deleteProcessBinding(id) {
  await integrationRequest(`/process-bindings/${id}`, { method: 'DELETE' });
}

/** @param {Record<string, unknown>} item */
export function normalizeIntegrationExecution(item) {
  if (!item || typeof item !== 'object') return null;
  const id = item.id ?? item.ID;
  if (id == null) return null;

  const parseJsonField = (value) => {
    if (value == null || value === '') return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  };

  return {
    id: Number(id),
    correlation_id: String(item.correlation_id ?? item.CorrelationID ?? ''),
    process_instance_id: Number(item.process_instance_id ?? item.ProcessInstanceID ?? 0),
    process_key: String(item.process_key ?? item.ProcessKey ?? ''),
    step_id: String(item.step_id ?? item.StepID ?? ''),
    action_id: String(item.action_id ?? item.ActionID ?? ''),
    mode: String(item.mode ?? item.Mode ?? ''),
    status: String(item.status ?? item.Status ?? ''),
    duration_ms: Number(item.duration_ms ?? item.DurationMs ?? 0),
    retry_count: Number(item.retry_count ?? item.RetryCount ?? 0),
    error_code: String(item.error_code ?? item.ErrorCode ?? ''),
    trace_id: String(item.trace_id ?? item.TraceID ?? ''),
    request_hash: String(item.request_hash ?? item.RequestHash ?? ''),
    request_meta_json: parseJsonField(item.request_meta_json ?? item.RequestMetaJSON),
    response_meta_json: parseJsonField(item.response_meta_json ?? item.ResponseMetaJSON),
    created_at: item.created_at ?? item.CreatedAt ?? null,
  };
}

/**
 * @param {{
 *   offset?: number,
 *   limit?: number,
 *   process_id?: string|number,
 *   status?: string,
 *   action_id?: string,
 *   from?: string,
 *   to?: string,
 * }} [opts]
 */
export async function listIntegrationExecutions(opts = {}) {
  const {
    offset = 0,
    limit = 25,
    process_id = '',
    status = '',
    action_id = '',
    from = '',
    to = '',
  } = opts;

  const params = { offset, limit };
  if (process_id !== '' && process_id != null) params.process_id = process_id;
  if (status) params.status = status;
  if (action_id) params.action_id = action_id;
  if (from) params.from = from;
  if (to) params.to = to;

  const json = await integrationRequest('/executions', { params });
  const data = unwrapData(json);
  const rawItems = Array.isArray(data?.items) ? data.items : [];
  const items = rawItems.map(normalizeIntegrationExecution).filter(Boolean);
  return {
    items,
    total: Number(data?.total ?? items.length),
  };
}

export async function getIntegrationExecution(id) {
  const json = await integrationRequest(`/executions/${id}`);
  return normalizeIntegrationExecution(unwrapData(json));
}

/** @param {Record<string, unknown>} item */
export function normalizeIntegrationDlq(item) {
  if (!item || typeof item !== 'object') return null;
  const id = item.id ?? item.ID;
  if (id == null) return null;

  const parseJsonField = (value) => {
    if (value == null || value === '') return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  };

  const executionId = item.execution_id ?? item.ExecutionID;

  return {
    id: Number(id),
    execution_id: executionId != null ? Number(executionId) : null,
    correlation_id: String(item.correlation_id ?? item.CorrelationID ?? ''),
    payload_json: parseJsonField(item.payload_json ?? item.PayloadJSON),
    error: String(item.error ?? item.Error ?? ''),
    retryable: Boolean(item.retryable ?? item.Retryable ?? true),
    resolved_at: item.resolved_at ?? item.ResolvedAt ?? null,
    created_at: item.created_at ?? item.CreatedAt ?? null,
  };
}

/**
 * @param {{
 *   offset?: number,
 *   limit?: number,
 *   process_key?: string,
 *   correlation_id?: string,
 *   resolved?: boolean|string|null,
 * }} [opts]
 */
export async function listIntegrationDlq(opts = {}) {
  const {
    offset = 0,
    limit = 25,
    process_key = '',
    correlation_id = '',
    resolved = false,
  } = opts;

  const params = { offset, limit };
  if (process_key) params.process_key = process_key;
  if (correlation_id) params.correlation_id = correlation_id;
  if (resolved !== null && resolved !== undefined && resolved !== '') {
    params.resolved = resolved;
  }

  const json = await integrationRequest('/dlq', { params });
  const data = unwrapData(json);
  const rawItems = Array.isArray(data?.items) ? data.items : [];
  const items = rawItems.map(normalizeIntegrationDlq).filter(Boolean);
  return {
    items,
    total: Number(data?.total ?? items.length),
  };
}

export async function retryIntegrationDlq(id) {
  const json = await integrationRequest(`/dlq/${id}/retry`, { method: 'POST' });
  return unwrapData(json);
}

export async function skipIntegrationDlq(id) {
  const json = await integrationRequest(`/dlq/${id}/skip`, { method: 'POST' });
  return unwrapData(json);
}

/** @param {Record<string, unknown>} item */
export function normalizeInboundWebhook(item) {
  if (!item || typeof item !== 'object') return null;
  const id = item.id ?? item.ID;
  if (id == null) return null;

  const parseJsonField = (value) => {
    if (value == null || value === '') return {};
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return value;
  };

  return {
    id: Number(id),
    token: String(item.token ?? item.Token ?? ''),
    action_id: Number(item.action_id ?? item.ActionID ?? 0),
    action_name: String(item.action_name ?? item.ActionName ?? ''),
    action_key: String(item.action_key ?? item.ActionKey ?? ''),
    connector_id: Number(item.connector_id ?? item.ConnectorID ?? 0),
    connector_name: String(item.connector_name ?? item.ConnectorName ?? ''),
    auth_type: String(item.auth_type ?? item.AuthType ?? 'api_key'),
    auth_config_json: parseJsonField(item.auth_config_json ?? item.AuthConfigJSON),
    inbound_mapping_json: parseJsonField(item.inbound_mapping_json ?? item.InboundMappingJSON) ?? null,
    is_active: Boolean(item.is_active ?? item.IsActive ?? true),
    created_at: item.created_at ?? item.CreatedAt ?? null,
    updated_at: item.updated_at ?? item.UpdatedAt ?? null,
  };
}

/**
 * @param {{
 *   offset?: number,
 *   limit?: number,
 *   isActive?: boolean|null,
 * }} [opts]
 */
export async function listInboundWebhooks(opts = {}) {
  const { offset = 0, limit = 25, isActive = null } = opts;
  const params = { offset, limit };
  if (isActive !== null && isActive !== undefined && isActive !== '') {
    params.is_active = isActive;
  }

  const json = await integrationRequest('/webhooks', { params });
  const data = unwrapData(json);
  const rawItems = Array.isArray(data?.items) ? data.items : [];
  const items = rawItems.map(normalizeInboundWebhook).filter(Boolean);
  return {
    items,
    total: Number(data?.total ?? items.length),
  };
}

export async function getInboundWebhook(id) {
  const json = await integrationRequest(`/webhooks/${id}`);
  return normalizeInboundWebhook(unwrapData(json));
}

/**
 * @param {{
 *   action_id: number,
 *   auth_type?: string,
 *   auth_config_json?: object,
 *   inbound_mapping_json?: object|null,
 *   is_active?: boolean,
 * }} payload
 */
export async function createInboundWebhook(payload) {
  const json = await integrationRequest('/webhooks', {
    method: 'POST',
    body: payload,
  });
  return normalizeInboundWebhook(unwrapData(json));
}

/**
 * @param {number|string} id
 * @param {Record<string, unknown>} payload
 */
export async function updateInboundWebhook(id, payload) {
  const json = await integrationRequest(`/webhooks/${id}`, {
    method: 'PUT',
    body: payload,
  });
  return normalizeInboundWebhook(unwrapData(json));
}

/**
 * @param {number|string} id
 * @param {object} [payload]
 */
export async function testInboundWebhook(id, payload = {}) {
  const url = `${INTEGRATION_API}/webhooks/${id}/test`;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ payload }),
    });
  } catch (e) {
    throw new Error(
      `اتصال به سرویس یکپارچه‌سازی برقرار نشد (${GATEWAY_BASE_URL}). ${e?.message || ''}`.trim()
    );
  }

  const json = await parseJson(res);
  const data = unwrapData(json);
  const envelope = json && typeof json === 'object' ? json : {};

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return {
      status: String(data.status ?? envelope.status ?? (res.ok ? 'success' : 'fail')),
      message: String(data.message ?? envelope.message ?? ''),
      status_code: Number(data.status_code ?? res.status),
      data: data.data ?? null,
    };
  }

  return {
    status: String(envelope.status ?? (res.ok ? 'success' : 'fail')),
    message: String(envelope.message ?? extractErrorMessage(json, 'تست ناموفق بود')),
    status_code: res.status,
    data: null,
  };
}

/** @param {Record<string, unknown>} item */
export function normalizeProcessDefinitionSummary(item) {
  if (!item || typeof item !== 'object') return null;
  const key = String(item.key ?? item.Key ?? '').trim();
  if (!key) return null;
  return {
    key,
    name: String(item.name ?? item.Name ?? key),
    version: Number(item.version ?? item.Version ?? 0),
  };
}

/** @param {Record<string, unknown>} item */
export function normalizeProcessDefinitionDetail(item) {
  const summary = normalizeProcessDefinitionSummary(item);
  if (!summary) return null;
  const bpmn =
    item.bpmn_json ?? item.BPMNJSON ?? item.bpmnJson ?? item.BpmnJSON ?? null;
  return {
    ...summary,
    bpmn_json: bpmn,
  };
}

async function engineRequest(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${ENGINE_BASE_URL}/api/engine${path}`, {
      method,
      headers: jsonHeaders(),
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error(
      `اتصال به موتور فرایند برقرار نشد (${ENGINE_BASE_URL}). ${e?.message || ''}`.trim()
    );
  }
  const json = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractErrorMessage(json, `درخواست موتور ناموفق بود (${res.status})`));
  }
  if (json && Object.prototype.hasOwnProperty.call(json, 'status') && json.status !== 'success') {
    throw new Error(extractErrorMessage(json, 'عملیات ناموفق بود'));
  }
  return json;
}

/** لیست تعاریف فعال فرایند از موتور — [{ key, name, version }] */
export async function listProcessDefinitions() {
  const json = await engineRequest('/process-definitions');
  const data = unwrapData(json);
  const rawItems = Array.isArray(data) ? data : [];
  return rawItems.map(normalizeProcessDefinitionSummary).filter(Boolean);
}

/** تعریف فعال یک فرایند همراه BPMN JSON */
export async function getProcessDefinition(processKey) {
  const key = String(processKey ?? '').trim();
  if (!key) return null;
  const json = await engineRequest(`/process-definitions/${encodeURIComponent(key)}`);
  return normalizeProcessDefinitionDetail(unwrapData(json));
}

export async function listAllIntegrationActions() {
  const { items: connectors } = await listConnectors({ limit: 100, offset: 0 });
  const results = await Promise.all(
    (connectors ?? []).map(async (connector) => {
      try {
        const actions = await listIntegrationActions(connector.id);
        return actions.map((action) => ({
          ...action,
          connector_name: connector.name,
        }));
      } catch {
        return [];
      }
    })
  );
  return results.flat();
}
