const AUTH_MESSAGES = {
  'user does not exist or has no access':
    'کاربر یافت نشد یا به این شعبه دسترسی ندارد. شناسه شعبه، شماره موبایل و نقش/دسترسی کاربر را بررسی کنید.',
  'branch not found':
    'شعبه با این شناسه در سیستم وجود ندارد (یا حذف شده). شناسه شعبه کاربر را در جدول users و رکورد branches بررسی کنید.',
  'branch is not active':
    'شعبه غیرفعال است. ابتدا شعبه را در پنل مدیریت فعال کنید یا با مدیر مرکزی تماس بگیرید.',
  'branch id does not match user branch':
    'شناسه شعبه با شعبهٔ ثبت‌شده برای این کاربر یکی نیست. شناسه شعبه را مطابق ستون branch_id همان کاربر در دیتابیس وارد کنید.',
  'user branch is not registered in branches':
    'شعبهٔ اختصاص‌یافته به کاربر در جدول branches وجود ندارد. ابتدا شعبه را ایجاد کنید یا branch_id کاربر را اصلاح کنید.',
  'invalid or missing company id': 'شناسه شرکت نامعتبر است یا وارد نشده.',
  'invalid or missing branch id': 'شناسه شعبه نامعتبر است یا وارد نشده.',
};

const QUOTA_MESSAGES = {
  'company branch limit exceeded': 'سقف تعداد شعب این شرکت تکمیل شده است.',
  'branch user limit exceeded': 'سقف تعداد کاربران فعال این شعبه تکمیل شده است.',
  'branch active user limit exceeded': 'سقف تعداد کاربران فعال این شعبه تکمیل شده است.',
};

const SERVICE_ENTITLEMENT_MESSAGES = {
  'branch service must be assigned to the parent central branch first':
    'هر خدمت باید قبلاً به شعبهٔ والد تخصیص داده شده باشد. شعبهٔ زیرمجموعه نمی‌تواند خدماتی بیش از شعبهٔ والد ارائه دهد.',
  'branch service must be assigned to the parent branch first':
    'هر خدمت باید قبلاً به شعبهٔ والد تخصیص داده شده باشد. شعبهٔ زیرمجموعه نمی‌تواند خدماتی بیش از شعبهٔ والد ارائه دهد.',
  'sub-branches cannot offer more services than their parent':
    'شعبهٔ زیرمجموعه نمی‌تواند خدماتی بیش از شعبهٔ والد ارائه دهد.',
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
  for (const [key, fa] of Object.entries(AUTH_MESSAGES)) {
    if (lower.includes(key)) return fa;
  }
  for (const [key, fa] of Object.entries(QUOTA_MESSAGES)) {
    if (lower.includes(key)) return fa;
  }
  for (const [key, fa] of Object.entries(SERVICE_ENTITLEMENT_MESSAGES)) {
    if (lower.includes(key)) return fa;
  }

  return text;
}

export function isSessionExpiredResponse(error) {
  const status = String(error?.response?.data?.status ?? '').trim();
  return status === 'session_expired' || status === 'session_required';
}
