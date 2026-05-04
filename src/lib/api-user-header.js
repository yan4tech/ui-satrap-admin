/**
 * مقدار هدر `user` برای درخواست‌های موتور (مثل قبلاً HARDCODED_USER_HEADER):
 * همان آبجکت `data.user` برگشتی از `GET /api/membership/user/me` به صورت JSON در sessionStorage.
 *
 * مرورگر در fetch() فقط مقادیر هدر سازگار با ISO-8859-1 می‌پذیرد؛ JSON با نام فارسی خطا می‌دهد.
 * بنابراین JSON را فقط-ASCII می‌کنیم (\uXXXX). JSON.parse در سرور همان آبجکت را برمی‌گرداند.
 */
export const MEMBERSHIP_USER_JSON_STORAGE_KEY = 'membership_user_json_header';

function jsonStringifyAsciiForHeader(obj) {
  return JSON.stringify(obj).replace(/[\u0080-\uFFFF]/g, (ch) =>
    `\\u${`0000${ch.charCodeAt(0).toString(16)}`.slice(-4)}`,
  );
}

function membershipUserJsonNeedsAsciiHeader(raw) {
  if (!raw) return false;
  for (let i = 0; i < raw.length; i += 1) {
    if (raw.charCodeAt(i) > 0x7f) return true;
  }
  return false;
}

export function setMembershipUserJsonFromObject(user) {
  if (typeof window === 'undefined') return;
  try {
    if (!user || typeof user !== 'object') {
      clearMembershipUserHeader();
      return;
    }
    window.sessionStorage.setItem(
      MEMBERSHIP_USER_JSON_STORAGE_KEY,
      jsonStringifyAsciiForHeader(user),
    );
  } catch {
    clearMembershipUserHeader();
  }
}

export function getMembershipUserHeaderString() {
  if (typeof window === 'undefined') return '';
  try {
    let raw = window.sessionStorage.getItem(MEMBERSHIP_USER_JSON_STORAGE_KEY) || '';
    if (raw && membershipUserJsonNeedsAsciiHeader(raw)) {
      try {
        const parsed = JSON.parse(raw);
        raw = jsonStringifyAsciiForHeader(parsed);
        window.sessionStorage.setItem(MEMBERSHIP_USER_JSON_STORAGE_KEY, raw);
      } catch {
        return '';
      }
    }
    return raw;
  } catch {
    return '';
  }
}

export function clearMembershipUserHeader() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(MEMBERSHIP_USER_JSON_STORAGE_KEY);
  } catch {
    // ignore
  }
}
