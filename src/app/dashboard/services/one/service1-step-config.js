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
  { elementId: 'review2', label: 'بررسی نهایی', isReview: true },
];

export const SERVICE1_STEPPER_LABELS = [
  SERVICE1_ENTRY_LABEL,
  ...SERVICE1_BPMN_USER_STEPS.map((s) => s.label),
];

const ELEMENT_TO_INDEX = Object.fromEntries(
  SERVICE1_BPMN_USER_STEPS.map((s, i) => [s.elementId, i + 1]),
);

export function getStepperIndexForElementId(elementId) {
  if (!elementId) return 0;
  if (elementId === 'start') return 0;
  const idx = ELEMENT_TO_INDEX[elementId];
  return idx ?? 1;
}

export function isReviewElementId(elementId) {
  return Boolean(SERVICE1_BPMN_USER_STEPS.find((s) => s.elementId === elementId && s.isReview));
}

/** اندیس ۰ = شروع؛ از ۱ به بعد مطابق SERVICE1_BPMN_USER_STEPS */
export function getBpmnElementIdForStepperIndex(stepIndex) {
  if (stepIndex <= 0) return null;
  return SERVICE1_BPMN_USER_STEPS[stepIndex - 1]?.elementId ?? null;
}
