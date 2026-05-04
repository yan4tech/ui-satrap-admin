/**
 * UserTask + ServiceReview visible on stepper (service1 / khedmat1).
 * ServiceTask and other auto steps are omitted.
 */
export const SERVICE1_ENTRY_LABEL = 'شروع';

export const SERVICE1_BPMN_USER_STEPS = [
  { elementId: 'payment', label: 'دریافت پرداخت' },
  { elementId: 'form1', label: 'پر کردن فرم ۱' },
  { elementId: 'review1', label: 'بررسی مرکزی فرم ۱', isReview: true },
  { elementId: 'enterCode', label: 'ورود کد پیامک' },
  { elementId: 'form2', label: 'پر کردن فرم ۲' },
  { elementId: 'centralReviewForm2', label: 'بررسی مرکزی فرم ۲', isReview: true },
  { elementId: 'review2', label: 'بررسی نهایی', isReview: true },
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

/** عدد کوچکتر = زودتر در فرایند؛ ناشناس آخر */
export function getService1WorkflowRank(elementId) {
  if (elementId == null || elementId === '') return 999;
  const key = String(elementId).trim().toLowerCase();
  const i = SERVICE1_ELEMENT_ORDER.map((e) => String(e).toLowerCase()).indexOf(key);
  return i === -1 ? 999 : i;
}

const ELEMENT_TO_INDEX = Object.fromEntries(
  SERVICE1_BPMN_USER_STEPS.map((s, i) => [String(s.elementId).toLowerCase(), i + 1]),
);

export function getStepperIndexForElementId(elementId) {
  if (!elementId) return 0;
  const key = String(elementId).trim().toLowerCase();
  if (key === 'start') return 0;
  const idx = ELEMENT_TO_INDEX[key];
  return idx ?? 1;
}

export function isReviewElementId(elementId) {
  const key = elementId == null ? '' : String(elementId).trim().toLowerCase();
  return Boolean(SERVICE1_BPMN_USER_STEPS.find((s) => String(s.elementId).toLowerCase() === key && s.isReview));
}

/** اندیس ۰ = شروع؛ از ۱ به بعد مطابق SERVICE1_BPMN_USER_STEPS */
export function getBpmnElementIdForStepperIndex(stepIndex) {
  if (stepIndex <= 0) return null;
  const id = SERVICE1_BPMN_USER_STEPS[stepIndex - 1]?.elementId ?? null;
  return id == null ? null : String(id).toLowerCase();
}
