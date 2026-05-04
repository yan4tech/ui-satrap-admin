/**
 * مقدار نمایش شماره تماس کاربر از شکل‌های رایج پاسخ API / ماک
 */
export function pickUserMobile(user) {
  if (!user || typeof user !== 'object') return '';
  const candidates = [
    user.mobile,
    user.phoneNumber,
    user.phone_number,
    user.phone,
    user.cellPhone,
    user.cell_phone,
  ];
  for (const v of candidates) {
    if (v != null && String(v).trim() !== '') {
      return String(v).trim();
    }
  }
  return '';
}
