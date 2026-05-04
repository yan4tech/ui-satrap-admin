/** مقادیر مجاز هدر `mode` برای API (هم‌راستا با بک‌اند) */
export const API_MODE_VALUES = ['mobile', 'company', 'branch'];

export const API_MODE_STORAGE_KEY = 'api_request_mode';

const DEFAULT_MODE = 'mobile';

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

export function setApiMode(mode) {
  if (typeof window === 'undefined') return;
  if (!API_MODE_VALUES.includes(mode)) return;
  try {
    window.sessionStorage.setItem(API_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}
