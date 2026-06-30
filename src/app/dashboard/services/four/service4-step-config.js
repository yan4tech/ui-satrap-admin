/**
 * UserTask + ServiceReview visible on stepper (service4 / khedmat4).
 * برچسب‌های مشترک با service2/3: شروع، پرداخت، اطلاعات اولیه، تایید توسط شرکت، ورود کد پیامک.
 */
const SERVICE4_ENTRY_LABEL = 'شروع';

const SERVICE4_BPMN_USER_STEPS = [
  { elementId: 'payment', label: 'پرداخت' },
  { elementId: 'stage1_initial', label: 'اطلاعات اولیه' },
  { elementId: 'review1', label: 'تایید توسط شرکت', isReview: true },
  { elementId: 'enterCode', label: 'ورود کد پیامک' },
  { elementId: 'stage3_claim_confirm', label: 'تایید ادعا' },
  { elementId: 'stage4_registry_inquiry', label: 'استعلام ثبتی سازمان', isReview: true },
  { elementId: 'tracking', label: 'نمایش پاسخ ثبت' },
  { elementId: 'stage5_expert_visit', label: 'بازدید کارشناس ثبتی' },
  { elementId: 'review5', label: 'تایید بازدید توسط شرکت', isReview: true },
  { elementId: 'stage6_committee', label: 'انتظار پاسخ هیئت', isReview: true },
  { elementId: 'stage7_announcement', label: 'انتشار آگهی رأی هیئت' },
  { elementId: 'stage8_objection', label: 'اعلام وجود/فقدان اعتراض', isReview: true },
  { elementId: 'stage9_court_decision', label: 'ارسال رأی دادگاه' },
  { elementId: 'stage10_committee_review', label: 'بررسی رأی دادگاه', isReview: true },
  { elementId: 'stage11_document_fee', label: 'پرداخت هزینه صدور سند' },
  { elementId: 'form2', label: 'آگهی نوبتی تحدید حدود' },
  { elementId: 'review2', label: 'تایید آگهی تحدید حدود', isReview: true },
  { elementId: 'stage12_issued', label: 'صدور سند' },
];

export const SERVICE4_STEPPER_LABELS = [
  SERVICE4_ENTRY_LABEL,
  ...SERVICE4_BPMN_USER_STEPS.map((s) => s.label),
];

function normalizeService4ElementIdKey(elementId) {
  if (elementId == null || elementId === '') return '';
  let key = String(elementId).trim().toLowerCase();
  if (key === 'centralreviewform2') return 'review2';
  if (key === 'form1') return 'stage1_initial';
  if (key === 'claimconfirm') return 'stage3_claim_confirm';
  if (key === 'expertvisit') return 'stage5_expert_visit';
  if (key === 'announcement') return 'stage7_announcement';
  if (key === 'objection') return 'stage8_objection';
  if (key === 'courtdecision') return 'stage9_court_decision';
  if (key === 'documentfee') return 'stage11_document_fee';
  if (key === 'announcementfee') return 'stage11_document_fee';
  if (key === 'landownerfee') return 'stage11_document_fee';
  if (key === 'issued') return 'stage12_issued';
  if (key === 'registrationtracking') return 'tracking';
  if (key === 'paymentsurvey' || key === 'payment1') return 'payment';
  return key;
}

const ELEMENT_TO_INDEX = Object.fromEntries(
  SERVICE4_BPMN_USER_STEPS.map((s, i) => [String(s.elementId).toLowerCase(), i + 1]),
);

Object.assign(ELEMENT_TO_INDEX, {
  paymentsurvey: ELEMENT_TO_INDEX.payment,
  payment1: ELEMENT_TO_INDEX.payment,
  form1: ELEMENT_TO_INDEX.stage1_initial,
  claimconfirm: ELEMENT_TO_INDEX.stage3_claim_confirm,
  registrationtracking: ELEMENT_TO_INDEX.tracking,
  expertvisit: ELEMENT_TO_INDEX.stage5_expert_visit,
  announcement: ELEMENT_TO_INDEX.stage7_announcement,
  objection: ELEMENT_TO_INDEX.stage8_objection,
  courtdecision: ELEMENT_TO_INDEX.stage9_court_decision,
  documentfee: ELEMENT_TO_INDEX.stage11_document_fee,
  announcementfee: ELEMENT_TO_INDEX.stage11_document_fee,
  stage11_announcement_fee: ELEMENT_TO_INDEX.stage11_document_fee,
  landownerfee: ELEMENT_TO_INDEX.stage11_document_fee,
  stage11_land_owner_fee: ELEMENT_TO_INDEX.stage11_document_fee,
  centralreviewform2: ELEMENT_TO_INDEX.review2,
  issued: ELEMENT_TO_INDEX.stage12_issued,
});

export function getService4StepperIndexForElementId(elementId) {
  if (!elementId) return 0;
  const raw = String(elementId).trim().toLowerCase();
  if (raw === 'start') return 0;
  const key = normalizeService4ElementIdKey(elementId);
  return ELEMENT_TO_INDEX[key] ?? 1;
}

export function getService4BpmnElementIdForStepperIndex(stepIndex) {
  if (stepIndex <= 0) return null;
  const id = SERVICE4_BPMN_USER_STEPS[stepIndex - 1]?.elementId ?? null;
  return id == null ? null : String(id).toLowerCase();
}

export function isService4ReviewElementId(elementId) {
  const key = normalizeService4ElementIdKey(elementId);
  return Boolean(SERVICE4_BPMN_USER_STEPS.find((s) => String(s.elementId).toLowerCase() === key && s.isReview));
}

/** SERVICE_REVIEW ids for pre-send central review (stage1/stage5 registry outbound). */
export function isService4PreSendReviewElementId(elementId) {
  const key = normalizeService4ElementIdKey(elementId);
  return key === 'review1' || key === 'review5';
}

export function getService4WorkflowRank(elementId) {
  return getService4StepperIndexForElementId(elementId);
}
