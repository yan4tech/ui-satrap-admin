const QUOTA_MESSAGES = {
  'company branch limit exceeded': 'سقف تعداد شعب این شرکت تکمیل شده است.',
  'branch user limit exceeded': 'سقف تعداد کاربران فعال این شعبه تکمیل شده است.',
  'branch active user limit exceeded': 'سقف تعداد کاربران فعال این شعبه تکمیل شده است.',
};

const SESSION_MESSAGES = {
  session_expired: 'نشست شما منقضی شده است. احتمالاً از دستگاه دیگری وارد شده‌اید.',
  session_required: 'نشست معتبر یافت نشد. لطفاً دوباره وارد شوید.',
};

/** استخراج پیام خطا از پاسخ membership (message، error، status). */
export function extractMembershipErrorMessage(error, fallback = 'خطا در انجام عملیات') {
  const data = error?.response?.data;
  if (!data) {
    return error?.message || fallback;
  }

  const statusKey = String(data.status ?? '').trim();
  if (SESSION_MESSAGES[statusKey]) {
    return SESSION_MESSAGES[statusKey];
  }

  const raw =
    data.message ||
    data.error ||
    (typeof data === 'string' ? data : null) ||
    error?.message;

  const text = String(raw ?? '').trim();
  if (!text) return fallback;

  const lower = text.toLowerCase();
  for (const [key, fa] of Object.entries(QUOTA_MESSAGES)) {
    if (lower.includes(key)) return fa;
  }

  return text;
}

export function isSessionExpiredResponse(error) {
  const status = String(error?.response?.data?.status ?? '').trim();
  return status === 'session_expired' || status === 'session_required';
}
