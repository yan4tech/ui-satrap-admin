/**
 * اعتبارسنجی کد ملی متقاضی — checksum + stub سن ۱۸+ و زنده بودن.
 * در محیط عملیاتی با هوک ثبت احوال / شاهکار جایگزین می‌شود.
 */

const STUB_DECEASED_NATIONAL_IDS = new Set(['0000000000', '1111111111']);

export function isValidIranianNationalIdChecksum(code) {
  if (!/^\d{10}$/.test(code)) return false;
  if (/^(\d)\1{9}$/.test(code)) return false;

  const check = Number(code[9]);
  const sum = [...code.slice(0, 9)].reduce(
    (acc, digit, index) => acc + Number(digit) * (10 - index),
    0,
  );
  const remainder = sum % 11;
  const expected = remainder < 2 ? remainder : 11 - remainder;
  return check === expected;
}

function stubMinimumAgeFromNationalId(nationalId) {
  const serialPart = nationalId.slice(3, 9);
  const yy = Number(serialPart.slice(0, 2));
  const mm = Number(serialPart.slice(2, 4));
  const dd = Number(serialPart.slice(4, 6));

  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    return { valid: true };
  }

  const birthYear = yy <= 50 ? 1400 + yy : 1300 + yy;
  const currentSolarYear = 1405;
  if (currentSolarYear - birthYear < 18) {
    return { valid: false, message: 'متقاضی باید بالای ۱۸ سال سن داشته باشد.' };
  }

  return { valid: true };
}

/**
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateApplicantNationalId(nationalId) {
  const code = String(nationalId ?? '').trim();
  if (!isValidIranianNationalIdChecksum(code)) {
    return { valid: false, message: 'کد ملی نامعتبر است.' };
  }

  if (STUB_DECEASED_NATIONAL_IDS.has(code)) {
    return { valid: false, message: 'متقاضی در قید حیات نیست.' };
  }

  return stubMinimumAgeFromNationalId(code);
}

/** Stub registry of experts authorized under Article 4 of the directive (mirrors backend). */
const STUB_ARTICLE4_ALLOWED_EXPERT_NATIONAL_IDS = new Set(['1234567891', '1000000011']);

/**
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateArticle4ExpertNationalId(nationalId) {
  const code = String(nationalId ?? '').trim();
  if (!code) {
    return { valid: false, message: 'کد ملی کارشناس امور ثبتی و حقوقی الزامی است.' };
  }
  if (!/^\d{10}$/.test(code)) {
    return { valid: false, message: 'کد ملی کارشناس باید ۱۰ رقم باشد.' };
  }

  const baseCheck = validateApplicantNationalId(code);
  if (!baseCheck.valid) {
    return { valid: false, message: baseCheck.message ?? 'کد ملی کارشناس معتبر نیست.' };
  }

  if (!STUB_ARTICLE4_ALLOWED_EXPERT_NATIONAL_IDS.has(code)) {
    return {
      valid: false,
      message: 'کارشناس باید از افراد مجاز برای کارشناسی موضوع ماده ۴ دستورالعمل باشد.',
    };
  }

  return { valid: true };
}
