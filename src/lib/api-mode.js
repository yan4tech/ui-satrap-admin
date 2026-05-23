/** مقادیر مجاز حالت ورود / session (هدر `mode` برای auth) */
export const API_MODE_VALUES = ['mobile', 'branch'];

export const API_MODE_LABELS_FA = {
  mobile: 'موبایل',
  branch: 'شعبه',
};

export const API_MODE_STORAGE_KEY = 'api_request_mode';

const DEFAULT_MODE = 'mobile';

/** برچسب فارسی برای یک مقدار `mode` */
export function getApiModeLabelFa(mode) {
  const m =
    mode && typeof mode === 'string' && API_MODE_VALUES.includes(mode) ? mode : DEFAULT_MODE;
  return API_MODE_LABELS_FA[m] ?? m;
}

export function getApiMode() {
  if (typeof window === 'undefined') {
    return DEFAULT_MODE;
  }
  try {
    const v = window.sessionStorage.getItem(API_MODE_STORAGE_KEY);
    if (v && API_MODE_VALUES.includes(v)) {
      return v;
    }
    if (v === 'company' || v === 'central') {
      return 'branch';
    }
  } catch {
    // ignore
  }
  return DEFAULT_MODE;
}

/** مقدار هدر `mode` برای درخواست‌های API پس از ورود */
export function getApiRequestMode() {
  return getApiMode();
}

export function setApiMode(mode) {
  if (typeof window === 'undefined') return;
  const normalized = mode === 'company' || mode === 'central' ? 'branch' : mode;
  if (!API_MODE_VALUES.includes(normalized)) return;
  try {
    window.sessionStorage.setItem(API_MODE_STORAGE_KEY, normalized);
  } catch {
    // ignore
  }
}

/** مدیر شعبه (شامل شعبه مرکزی) — با mode شعبه وارد می‌شود */
export function isBranchDashboardLoginMode() {
  return getApiMode() === 'branch';
}

/** @deprecated use isBranchDashboardLoginMode */
export function isCentralBranchTenantLoginMode() {
  return isBranchDashboardLoginMode();
}

/** @deprecated use isBranchDashboardLoginMode */
export function isCompanyTenantLoginMode() {
  return isBranchDashboardLoginMode();
}

/** @deprecated removed — central org login merged into branch mode */
export function isCentralLoginMode() {
  return false;
}
