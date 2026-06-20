const PROCESS_STATUS_LABELS = {
  RUNNING: 'در حال اجرا',
  WAITING_CENTRAL: 'در انتظار شعبه مرکزی',
  WAITING_BRANCH: 'در انتظار شعبه',
  WAITING_EXTERNAL: 'در انتظار سامانه بیرونی',
  LOCKED: 'قفل شده',
  REJECTED: 'رد شده',
  COMPLETED: 'تکمیل شده',
  DONE: 'انجام شده',
  FAILED: 'ناموفق',
  CANCELLED: 'لغوشده',
  SUSPENDED: 'معلق',
};

const ACTION_LABELS = {
  SUBMIT_TO_CENTRAL: 'ارسال به شعبه مرکزی',
  APPROVE: 'تایید',
  REJECT: 'رد',
  NEEDS_CORRECTION: 'نیاز به اصلاح',
  RETURN_TO_BRANCH: 'بازگشت به شعبه',
  LOCK: 'قفل',
  UNLOCK: 'باز کردن قفل',
  SEND_TO_EXTERNAL: 'ارسال به سامانه بیرونی',
  COMPLETE: 'تکمیل مرحله',
};

const PARTY_LABELS = {
  USER: 'کاربر / شعبه',
  COMPANY: 'شرکت (بازبین)',
  SYSTEM: 'سیستم',
  BRANCH: 'شعبه',
  CENTRAL: 'شعبه مرکزی',
};

const BPMN_ELEMENT_LABELS = {
  start: 'شروع فرایند',
  generate: 'تولید شناسه و محاسبه هزینه',
  stage1_initial: 'ارسال داده‌های اولیه متقاضی و ادعا',
  stage1_send_registry: 'ارسال یکجای داده‌های مرحله ۱ به سازمان',
  stage4_send_registry: 'ارسال یکجای داده استعلام ثبتی به سازمان',
  stage5_send_registry: 'ارسال یکجای داده بازدید به سازمان',
  form1: 'ارسال داده‌های اولیه متقاضی و ادعا',
  review1: 'تایید اطلاعات اولیه',
  review5: 'تایید بازدید کارشناس',
  payment: 'پرداخت',
  paymentsurvey: 'پرداخت (نظرسنجی)',
  payment1: 'پرداخت',
  sendagency: 'ارسال رضایت متقاضی (OTP/SMS)',
  tracking: 'نمایش پاسخ ثبت',
  registrationtracking: 'پیگیری ثبت',
  form2: 'آگهی نوبتی تحدید حدود',
  centralreviewform2: 'تایید آگهی تحدید حدود',
  review2: 'تایید آگهی تحدید حدود',
  entercode: 'اخذ رضایت متقاضی (OTP/SMS)',
  stage3_claim_confirm: 'تأیید اطلاعات ادعا توسط متقاضی',
  claimconfirm: 'تأیید اطلاعات ادعا توسط متقاضی',
  stage4_registry_inquiry: 'استعلام ثبتی سازمان',
  stage5_expert_visit: 'بازدید کارشناس امور ثبتی و حقوقی',
  expertvisit: 'بازدید کارشناس امور ثبتی و حقوقی',
  stage6_committee: 'ارسال به هیئت تعیین تکلیف',
  stage7_announcement: 'انتشار آگهی رأی هیئت',
  announcement: 'انتشار آگهی رأی هیئت',
  stage8_objection: 'اعلام وجود/فقدان اعتراض',
  objection: 'اعلام وجود/فقدان اعتراض',
  stage9_court_decision: 'ارسال رأی دادگاه',
  courtdecision: 'ارسال رأی دادگاه',
  stage10_committee_review: 'بررسی رأی دادگاه توسط دبیرخانه',
  stage11_document_fee: 'پرداخت هزینه صدور سند',
  documentfee: 'پرداخت هزینه صدور سند',
  generate_document_fee: 'آماده‌سازی هزینه صدور سند',
  stage11_announcement_fee: 'پرداخت هزینه آگهی تحدید حدود',
  announcementfee: 'پرداخت هزینه آگهی تحدید حدود',
  generate_announcement_fee: 'آماده‌سازی هزینه آگهی تحدید حدود',
  stage11_land_owner_fee: 'پرداخت اجرت/بهای عرصه (ماده ۱۲)',
  landownerfee: 'پرداخت اجرت/بهای عرصه (ماده ۱۲)',
  generate_land_owner_fee: 'آماده‌سازی اجرت/بهای عرصه',
  generate_issued_document: 'آماده‌سازی اطلاعات سند صادرشده',
  stage12_issued: 'صدور سند',
  stage12_notify: 'اطلاع‌رسانی صدور سند به متقاضی',
  issued: 'صدور سند',
  end: 'پایان موفق فرایند',
  end_stage1_rejected: 'توقف — رد در مرحله ۱',
  end_stage4_rejected: 'توقف — رد استعلام ثبتی (مرحله ۴)',
  end_stage5_cannot_issue: 'توقف — عدم امکان صدور از استعلام ثبت (مرحله ۵)',
  end_stage5_rejected: 'توقف — رد بازدید کارشناس (مرحله ۵)',
};

export function getBpmnElementLabel(elementId) {
  const key = String(elementId ?? '').trim().toLowerCase();
  return BPMN_ELEMENT_LABELS[key] ?? (elementId || '—');
}

export function getProcessStatusLabel(status) {
  const key = String(status ?? '').trim().toUpperCase();
  return PROCESS_STATUS_LABELS[key] ?? (status || '—');
}

export function getProcessActionLabel(action) {
  const key = String(action ?? '').trim().toUpperCase();
  return ACTION_LABELS[key] ?? (action || '—');
}

export function getResponsiblePartyLabel(party) {
  const key = String(party ?? '').trim().toUpperCase();
  return PARTY_LABELS[key] ?? (party || '—');
}

export function timelineDotColor(entry) {
  const action = String(entry?.action ?? '').trim().toUpperCase();
  if (action === 'REJECT' || entry?.successful === false) return 'error';
  if (action === 'APPROVE' || action === 'COMPLETE') return 'success';
  if (action === 'NEEDS_CORRECTION' || action === 'RETURN_TO_BRANCH') return 'warning';
  if (action === 'SUBMIT_TO_CENTRAL' || action === 'SEND_TO_EXTERNAL') return 'info';
  return 'grey';
}

export function normalizeHistoryEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const attempt = raw.attempt_detail ?? raw.AttemptDetail ?? null;
  return {
    id: raw.ID ?? raw.id,
    taskId: raw.task_id ?? raw.TaskID ?? raw.taskId,
    stepId: raw.step_id ?? raw.StepID ?? raw.stepId ?? '',
    stepName: raw.step_name ?? raw.StepName ?? raw.stepName ?? '',
    elementType: raw.element_type ?? raw.ElementType ?? '',
    responsibleParty: raw.responsible_party ?? raw.ResponsibleParty ?? '',
    attempt: raw.attempt ?? raw.Attempt ?? 0,
    successful: raw.successful ?? raw.Successful,
    errorMessage: raw.error_message ?? raw.ErrorMessage ?? '',
    oldStatus: raw.old_status ?? raw.OldStatus ?? '',
    newStatus: raw.new_status ?? raw.NewStatus ?? '',
    action: raw.action ?? raw.Action ?? '',
    performedBy:
      raw.performed_by ??
      raw.PerformedBy ??
      attempt?.actor_id ??
      attempt?.ActorID ??
      0,
    performedAt: raw.performed_at ?? raw.PerformedAt ?? raw.CreatedAt ?? raw.created_at,
    attemptDetail: attempt,
  };
}
