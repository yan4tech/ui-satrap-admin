import { integrationApiBase } from 'src/lib/integration-api';

export const WEBHOOK_AUTH_TYPES = [
  { value: 'api_key', label: 'API Key' },
  { value: 'hmac', label: 'HMAC' },
  { value: 'none', label: 'بدون احراز هویت' },
];

export function webhookAuthTypeLabel(authType) {
  return WEBHOOK_AUTH_TYPES.find((t) => t.value === authType)?.label ?? authType ?? '—';
}

/** مسیر عمومی (Traefik یا gateway مستقیم بسته به NEXT_PUBLIC_GATEWAY_URL) */
export function buildInboundWebhookUrl(token) {
  const t = String(token ?? '').trim();
  if (!t) return '';
  return `${integrationApiBase()}/inbound/${encodeURIComponent(t)}`;
}

/** مسیر مستقیم سرویس gateway (مطابق پرامپت) */
export function buildInboundWebhookDirectPath(token) {
  const t = String(token ?? '').trim();
  if (!t) return '';
  return `/api/integration/inbound/${encodeURIComponent(t)}`;
}

export const DEFAULT_WEBHOOK_TEST_PAYLOAD = {
  correlation_id: 'sample-correlation-id',
  status: 'APPROVED',
  reference_id: 'test-ref-001',
};

export function formatWebhookTestPayload(value) {
  if (value == null || value === '') {
    return JSON.stringify(DEFAULT_WEBHOOK_TEST_PAYLOAD, null, 2);
  }
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

/** @param {unknown} authConfig */
export function parseWebhookAuthConfig(authConfig) {
  if (!authConfig) return {};
  if (typeof authConfig === 'string') {
    try {
      return JSON.parse(authConfig);
    } catch {
      return {};
    }
  }
  if (typeof authConfig === 'object') return authConfig;
  return {};
}

export function getWebhookApiKey(authConfig) {
  const cfg = parseWebhookAuthConfig(authConfig);
  return String(cfg.api_key ?? '');
}

export function getWebhookHmacSecret(authConfig) {
  const cfg = parseWebhookAuthConfig(authConfig);
  return String(cfg.secret ?? '');
}

export function getWebhookHeaderName(authConfig, authType) {
  const cfg = parseWebhookAuthConfig(authConfig);
  if (cfg.header_name) return String(cfg.header_name);
  if (authType === 'hmac') return 'X-Signature';
  if (authType === 'api_key') return 'X-API-Key';
  return '';
}
