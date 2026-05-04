import { getApiMode } from './api-mode';

const BRANCH_ID_STORAGE_KEY = 'api_branch_id';

export function setBranchIdForApi(value) {
  if (typeof window === 'undefined') return;
  try {
    const v = String(value ?? '').trim();
    if (!v) {
      window.sessionStorage.removeItem(BRANCH_ID_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(BRANCH_ID_STORAGE_KEY, v);
  } catch {
    // ignore
  }
}

export function getBranchIdStored() {
  if (typeof window === 'undefined') return '';
  try {
    return String(window.sessionStorage.getItem(BRANCH_ID_STORAGE_KEY) ?? '').trim();
  } catch {
    return '';
  }
}

export function clearBranchIdForApi() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(BRANCH_ID_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** مقدار هدر `branch` فقط وقتی mode برابر `branch` است؛ در غیر این صورت null تا هدر ست نشود. */
export function getBranchRequestHeaderValue() {
  if (getApiMode() !== 'branch') return null;
  const id = getBranchIdStored();
  return id === '' ? null : id;
}
