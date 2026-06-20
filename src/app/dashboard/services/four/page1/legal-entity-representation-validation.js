/**
 * اعتبارسنجی شناسه ملی شخص حقوقی و استعلام نمایندگی از پایگاه اشخاص حقوقی.
 * در محیط عملیاتی با سرویس ثبت شرکت‌ها جایگزین می‌شود.
 */

/** @type {Map<string, Set<string>>} legalEntityNationalId → representative national IDs */
const STUB_LEGAL_PERSONS_REGISTRY = new Map([
  ['10100000015', new Set(['0012345678', '1234567891'])],
  ['10200000011', new Set(['0012345678'])],
]);

export function isValidLegalEntityNationalId(code) {
  const value = String(code ?? '').trim();
  if (!/^\d{11}$/.test(value)) return false;
  if (/^(\d)\1{10}$/.test(value)) return false;

  const check = Number(value[10]);
  const sum = [...value.slice(0, 10)].reduce(
    (acc, digit, index) => acc + Number(digit) * (index + 2),
    0,
  );
  const remainder = sum % 11;
  const expected = remainder < 2 ? remainder : 11 - remainder;
  return check === expected;
}

/**
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateLegalEntityNationalId(legalEntityNationalId) {
  const code = String(legalEntityNationalId ?? '').trim();
  if (!isValidLegalEntityNationalId(code)) {
    return { valid: false, message: 'شناسه ملی شخص حقوقی نامعتبر است.' };
  }
  return { valid: true };
}

/**
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateLegalPersonsRegistryRepresentative(applicantNationalId, legalEntityNationalId) {
  const applicant = String(applicantNationalId ?? '').trim();
  const entity = String(legalEntityNationalId ?? '').trim();

  const entityCheck = validateLegalEntityNationalId(entity);
  if (!entityCheck.valid) {
    return entityCheck;
  }

  const registeredRepresentatives = STUB_LEGAL_PERSONS_REGISTRY.get(entity);
  if (!registeredRepresentatives?.has(applicant)) {
    return {
      valid: false,
      message:
        'متقاضی در پایگاه اطلاعات اشخاص حقوقی به عنوان نماینده این شخص حقوقی ثبت نشده است.',
    };
  }

  return { valid: true };
}
