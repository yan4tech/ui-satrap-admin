/** مقادیر مجاز حالت ورود / session (هدر `mode` برای auth) */
export const API_MODE_VALUES = ['mobile', 'central', 'company', 'branch'];

export const API_MODE_LABELS_FA = {
  mobile: 'موبایل',
  central: 'سازمان مرکزی',
  company: 'شرکت',
  branch: 'شعبه',
};

export const API_MODE_STORAGE_KEY = 'api_request_mode';

const DEFAULT_MODE = 'mobile';

/** برچسب فارسی برای یک مقدار `mode` (یا مقدار پیش‌فرض در صورت نامعتبر بودن) */
export function getApiModeLabelFa(mode) {
  const m =
    mode && typeof mode === 'string' && API_MODE_VALUES.includes(mode) ? mode : DEFAULT_MODE;
  return API_MODE_LABELS_FA[m] ?? m;
}

/** حالت ذخیره‌شده پس از انتخاب در صفحه ورود */
export function getApiMode() {
  if (typeof window === 'undefined') {
    return DEFAULT_MODE;
  }
  try {
    const v = window.sessionStorage.getItem(API_MODE_STORAGE_KEY);
    if (v && API_MODE_VALUES.includes(v)) {
      return v;
    }
  } catch {
    // حالت خصوصی / غیرقابل دسترس
  }
  return DEFAULT_MODE;
}

/**
 * مقدار هدر `mode` برای درخواست‌های API پس از ورود.
 * سازمان مرکزی و شرکت هر دو از هدر company برای سرویس membership استفاده می‌کنند.
 */
export function getApiRequestMode() {
  const mode = getApiMode();
  if (mode === 'central') {
    return 'company';
  }
  return mode;
}

export function setApiMode(mode) {
  if (typeof window === 'undefined') return;
  if (!API_MODE_VALUES.includes(mode)) return;
  try {
    window.sessionStorage.setItem(API_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

/** آیا کاربر با حالت سازمان مرکزی وارد شده است؟ */
export function isCentralLoginMode() {
  return getApiMode() === 'central';
}

/** آیا کاربر با حالت شرکت (مدیر شرکت) وارد شده است؟ */
export function isCompanyTenantLoginMode() {
  return getApiMode() === 'company';
}
