/**
 * UserTask + ServiceReview visible on stepper (service1 / khedmat1).
 * ServiceTask and other auto steps are omitted.
 */
export const SERVICE1_ENTRY_LABEL = 'شروع';

export const SERVICE1_BPMN_USER_STEPS = [
  { elementId: 'payment', label: 'پرداخت' },
  { elementId: 'form1', label: 'اطلاعات اولیه' },
  { elementId: 'review1', label: 'تایید اطلاعات اولیه', isReview: true },
  { elementId: 'enterCode', label: 'ورود کد پیامک' },
  /** در BPMN1 معمولاً `payment1`؛ نام قدیمی UI: paymentSurvey */
  { elementId: 'payment1', label: 'پرداخت هزینه نقشه برداری' },
  { elementId: 'form2', label: 'نقشه برداری' },
  /** در BPMN موتور همین node با element_id برابر review2 و نام «Central Review Form 2» است */
  { elementId: 'review2', label: 'تایید نقشه برداری', isReview: true },
];

export const SERVICE1_STEPPER_LABELS = [
  SERVICE1_ENTRY_LABEL,
  ...SERVICE1_BPMN_USER_STEPS.map((s) => s.label),
];

/** ترتیب مراحل در pipeline خدمت۱ — برای مرتب‌سازی تسک‌های باز و نگاشت به استپر */
export const SERVICE1_ELEMENT_ORDER = [
  'start',
  ...SERVICE1_BPMN_USER_STEPS.map((s) => s.elementId),
];

/** یکسان‌سازی element_id موتور با کلیدهای پیکربندی UI */
export function normalizeService1ElementIdKey(elementId) {
  if (elementId == null || elementId === '') return '';
  let key = String(elementId).trim().toLowerCase();
  if (key === 'centralreviewform2') return 'review2';
  if (key === 'paymentsurvey') return 'payment1';
  return key;
}

/** عدد کوچکتر = زودتر در فرایند؛ ناشناس آخر */
export function getService1WorkflowRank(elementId) {
  if (elementId == null || elementId === '') return 999;
  const key = normalizeService1ElementIdKey(elementId);
  const i = SERVICE1_ELEMENT_ORDER.map((e) => String(e).toLowerCase()).indexOf(key);
  return i === -1 ? 999 : i;
}

const ELEMENT_TO_INDEX = Object.fromEntries(
  SERVICE1_BPMN_USER_STEPS.map((s, i) => [String(s.elementId).toLowerCase(), i + 1]),
);

export function getStepperIndexForElementId(elementId) {
  if (!elementId) return 0;
  const raw = String(elementId).trim().toLowerCase();
  if (raw === 'start') return 0;
  const key = normalizeService1ElementIdKey(elementId);
  const idx = ELEMENT_TO_INDEX[key];
  return idx ?? 1;
}

export function isReviewElementId(elementId) {
  const key = normalizeService1ElementIdKey(elementId);
  return Boolean(SERVICE1_BPMN_USER_STEPS.find((s) => String(s.elementId).toLowerCase() === key && s.isReview));
}

/** اندیس ۰ = شروع؛ از ۱ به بعد مطابق SERVICE1_BPMN_USER_STEPS */
export function getBpmnElementIdForStepperIndex(stepIndex) {
  if (stepIndex <= 0) return null;
  const id = SERVICE1_BPMN_USER_STEPS[stepIndex - 1]?.elementId ?? null;
  return id == null ? null : String(id).toLowerCase();
}
