/**
 * اعتبارسنجی کد رهگیری نقشه فرعی و دسترسی متقاضی در سامانه مانا.
 * در محیط عملیاتی با سرویس مانا جایگزین می‌شود.
 */

/** @type {Map<string, Set<string>>} trackingCode → national IDs with Mana access */
const STUB_MANA_MAP_ACCESS = new Map([
  ['MAP-10001', new Set(['0012345678', '1234567891'])],
  ['MAP-10002', new Set(['0012345678'])],
  ['CORR-MAP-10001', new Set(['0012345678', '1234567891'])],
  ['CORR-MAP-10002', new Set(['0012345678'])],
]);

/**
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateSubsidiaryMapManaAccess(applicantNationalId, subsidiaryMapTrackingCode) {
  const applicant = String(applicantNationalId ?? '').trim();
  const trackingCode = String(subsidiaryMapTrackingCode ?? '').trim();

  if (!trackingCode) {
    return { valid: false, message: 'کد رهگیری نقشه فرعی الزامی است.' };
  }

  const authorizedApplicants = STUB_MANA_MAP_ACCESS.get(trackingCode);
  if (!authorizedApplicants) {
    return {
      valid: false,
      message: 'کد رهگیری نقشه فرعی یافت نشد یا متقاضی دسترسی مانا به این نقشه را ندارد.',
    };
  }

  if (!authorizedApplicants.has(applicant)) {
    return {
      valid: false,
      message: 'متقاضی در سامانه مانا مجوز دسترسی به نقشه فرعی مربوطه را ندارد.',
    };
  }

  return { valid: true };
}
