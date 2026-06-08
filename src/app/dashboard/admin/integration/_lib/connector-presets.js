/** الگوهای آماده برای ساخت سریع کانکتور/اکشن بدون نوشتن JSON دستی */

const SHAHKAR_CONFIG = {
  timeout_ms: 15000,
  retry_count: 1,
  auth_type: 'api_key_header',
  auth: {
    header_name: 'X-API-Key',
  },
};

export const CONNECTOR_PRESETS = [
  {
    id: 'shahkar',
    label: 'شاهکار (REST)',
    description: 'اتصال به سرویس شاهکار با cred://prod/shahkar',
    values: {
      name: 'shahkar-v1',
      type: 'rest',
      credential_ref: 'cred://prod/shahkar',
      config_json: JSON.stringify(SHAHKAR_CONFIG, null, 2),
    },
    actionPreset: {
      name: 'Shahkar Verify Mobile',
      action_key: 'shahkar.verify_mobile',
      rest_method: 'POST',
      rest_path: '/verify',
      rest_headers: JSON.stringify({ 'Content-Type': 'application/json' }, null, 2),
      rest_timeout: '15000',
      input_schema_json: JSON.stringify(
        {
          type: 'object',
          properties: {
            mobile: { type: 'string' },
            national_id: { type: 'string' },
          },
        },
        null,
        2
      ),
      output_schema_json: JSON.stringify({ type: 'object', properties: {} }, null, 2),
    },
    bindHint: {
      processKey: 'service1',
      stepId: 'sendAgency1',
      label: 'اتصال به sendAgency1 (خدمت ۱)',
    },
  },
];

/** @param {string} presetId */
export function getConnectorPreset(presetId) {
  return CONNECTOR_PRESETS.find((p) => p.id === presetId) ?? null;
}

/** @param {string} connectorName */
export function guessPresetForConnector(connectorName) {
  const name = String(connectorName ?? '').toLowerCase();
  if (name.includes('shahkar')) return getConnectorPreset('shahkar');
  return null;
}
