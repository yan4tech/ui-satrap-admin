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
