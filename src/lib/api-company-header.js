import { getApiMode } from './api-mode';

const COMPANY_ID_STORAGE_KEY = 'api_company_id';

export function setCompanyIdForApi(value) {
  if (typeof window === 'undefined') return;
  try {
    const v = String(value ?? '').trim();
    if (!v) {
      window.sessionStorage.removeItem(COMPANY_ID_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(COMPANY_ID_STORAGE_KEY, v);
  } catch {
    // ignore
  }
}

export function getCompanyIdStored() {
  if (typeof window === 'undefined') return '';
  try {
    return String(window.sessionStorage.getItem(COMPANY_ID_STORAGE_KEY) ?? '').trim();
  } catch {
    return '';
  }
}

export function clearCompanyIdForApi() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(COMPANY_ID_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** مقدار هدر `company` فقط وقتی mode برابر `company` است؛ در غیر این صورت null تا هدر ست نشود. */
export function getCompanyRequestHeaderValue() {
  if (getApiMode() !== 'company') return null;
  const id = getCompanyIdStored();
  return id === '' ? null : id;
}
