/**
 * اعتبارسنجی موبایل متقاضی — فرمت + stub تطابق شاهکار.
 * در محیط عملیاتی با سرویس shahkar.verify_mobile جایگزین می‌شود.
 */

/** @type {Map<string, string>} nationalId → mobile */
const STUB_SHAHKAR_PAIRS = new Map([
  ['0012345678', '09121234567'],
  ['1234567891', '09123456789'],
]);

/**
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateApplicantMobile(nationalId, mobile) {
  const mobileStr = String(mobile ?? '').trim();
  if (!/^09\d{9}$/.test(mobileStr)) {
    return { valid: false, message: 'شماره موبایل نامعتبر است' };
  }

  const nationalStr = String(nationalId ?? '').trim();
  if (!nationalStr) {
    return { valid: true };
  }

  const expectedMobile = STUB_SHAHKAR_PAIRS.get(nationalStr);
  if (expectedMobile === undefined) {
    return { valid: true };
  }

  if (expectedMobile !== mobileStr) {
    return {
      valid: false,
      message: 'شماره موبایل با کد ملی متقاضی در سامانه شاهکار تطابق ندارد.',
    };
  }

  return { valid: true };
}
