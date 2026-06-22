/** عناوین رسمی خدمات — منبع واحد برای تمام UI */

export const SERVICE_DEFINITION_KEYS = ['service1', 'service2', 'service3'];

/** @type {Record<'service1'|'service2'|'service3', string>} */
export const SERVICE_LABELS = {
  service1: 'تهیه نقشه ثبتی',
  service2:
    'درج گواهی اقدام موضوع ماده (10) قانون الزام به ثبت رسمی معاملات اموال غیرمنقول',
  service3: 'درج ادعا موضوع ماده (10) قانون الزام به ثبت رسمی معاملات اموال غیرمنقول',
};

/** نگاشت شناسه عددی خدمت (۱، ۲، ۳) به کلید فرایند */
export const SERVICE_ID_TO_KEY = {
  1: 'service1',
  2: 'service2',
  3: 'service3',
};

/** @param {unknown} processKey */
export function getServiceLabel(processKey) {
  const key = String(processKey ?? '').trim();
  return SERVICE_LABELS[key] ?? (key || '—');
}

/** @param {unknown} serviceId */
export function getServiceLabelById(serviceId) {
  const id = Number(serviceId);
  const key = SERVICE_ID_TO_KEY[id];
  return key ? SERVICE_LABELS[key] : `خدمت ${id}`;
}

/** @param {unknown} processKey */
export function getServiceBpmnName(processKey) {
  const key = String(processKey ?? '').trim();
  const label = SERVICE_LABELS[key];
  if (!label) return key || '—';
  const slug = key.replace('service', 'khedmat');
  return `${label} (${slug})`;
}

export const SERVICE_LABEL_OPTIONS = SERVICE_DEFINITION_KEYS.map((value) => ({
  value,
  label: SERVICE_LABELS[value],
}));

export const DEFINITION_LABELS = { ...SERVICE_LABELS };

/** ردیف نمایشی داشبورد — نام رسمی خدمت + آمار */
export function dashboardServiceRow(processKey, stats = {}) {
  return { name: SERVICE_LABELS[processKey] ?? processKey, ...stats };
}
