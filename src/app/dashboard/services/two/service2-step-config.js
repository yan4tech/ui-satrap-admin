export const SERVICE2_STEPPER_LABELS = [
  'شروع',
  'پرداخت',
  'اطلاعات اولیه',
  'تایید توسط شرکت',
  'ورود کد پیامک',
  'گواهی اقدام',
  'تایید گواهی اقدام توسط شرکت',
];

const ELEMENT_TO_INDEX = {
  payment: 1,
  paymentsurvey: 1,
  payment1: 1,
  form1: 2,
  review1: 3,
  entercode: 4,
  tracking: 4,
  registrationtracking: 4,
  form2: 5,
  centralreviewform2: 6,
  review2: 6,
};

export function getService2StepperIndexForElementId(elementId) {
  if (!elementId) return 0;
  const key = String(elementId).trim().toLowerCase();
  if (key === 'start') return 0;
  return ELEMENT_TO_INDEX[key] ?? 1;
}

export function getService2BpmnElementIdForStepperIndex(stepIndex) {
  if (stepIndex <= 0) return null;
  if (stepIndex === 1) return 'payment';
  if (stepIndex === 2) return 'form1';
  if (stepIndex === 3) return 'review1';
  if (stepIndex === 4) return 'tracking';
  if (stepIndex === 5) return 'form2';
  if (stepIndex === 6) return 'review2';
  return null;
}

export function getService2WorkflowRank(elementId) {
  return getService2StepperIndexForElementId(elementId);
}
