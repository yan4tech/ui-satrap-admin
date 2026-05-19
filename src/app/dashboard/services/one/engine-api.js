import { getApiMode, getApiRequestMode } from 'src/lib/api-mode';
import { getBranchRequestHeaderValue } from 'src/lib/api-branch-header';
import { getMembershipUserHeaderString } from 'src/lib/api-user-header';
import { getSessionBearerAuthorization } from 'src/lib/session-bearer-header';

import { isReviewElementId, getService1WorkflowRank } from './service1-step-config';

const ENGINE_BASE_RAW =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENGINE_URL?.trim()) || 'http://localhost:3503';

/** پایهٔ URL موتور؛ پیش‌فرض localhost — با `NEXT_PUBLIC_ENGINE_URL` در env ست شود */
export const ENGINE_BASE_URL = ENGINE_BASE_RAW.replace(/\/+$/, '');

/**
 * استخراج آرایهٔ آیتم‌ها از پاسخ‌های مختلف لیست فرایندها (snake_case / PascalCase / آرایهٔ مستقیم).
 */
function extractRawProcessListItems(envelope) {
  const root = envelope && typeof envelope === 'object' ? envelope : {};
  const inner = root.data !== undefined ? root.data : root;

  if (Array.isArray(inner)) {
    return inner;
  }
  if (inner && typeof inner === 'object') {
    const from =
      inner.items ??
      inner.Items ??
      inner.processes ??
      inner.Processes ??
      inner.list ??
      inner.List ??
      inner.rows ??
      inner.Rows;
    if (Array.isArray(from)) return from;
  }
  return [];
}

/** هر آیتم را به شکل `{ process, tasks }` با `process.ID` یکتا نگه می‌دارد */
function normalizeProcessListRow(raw) {
  if (!raw || typeof raw !== 'object') return null;

  let processObj = raw.process ?? raw.Process;
  let tasks = raw.tasks ?? raw.Tasks ?? raw.task_map ?? raw.TaskMap;

  if (!processObj || typeof processObj !== 'object') {
    const looksLikeProcess =
      raw.ID != null ||
      raw.id != null ||
      raw.process_instance_id != null ||
      raw.definition_key != null ||
      raw.DefinitionKey != null;
    if (looksLikeProcess) {
      processObj = raw;
      tasks = raw.tasks ?? raw.Tasks ?? {};
    } else {
      return null;
    }
  }

  const id =
    processObj.ID ??
    processObj.id ??
    processObj.process_instance_id ??
    processObj.ProcessInstanceID ??
    processObj.ProcessInstanceId;
  if (id == null) return null;

  const process = {
    ...processObj,
    ID: id,
    definition_key:
      processObj.definition_key ??
      processObj.DefinitionKey ??
      processObj.definitionKey ??
      '',
    status: processObj.status ?? processObj.Status,
    variables: processObj.variables ?? processObj.Variables ?? processObj.variables_json,
    started_at: processObj.started_at ?? processObj.StartedAt,
    StartedAt: processObj.StartedAt ?? processObj.started_at,
    UpdatedAt: processObj.UpdatedAt ?? processObj.updated_at ?? processObj.updatedAt,
  };

  return { process, tasks: tasks ?? {} };
}

function normalizeFetchProcessesResult(envelope) {
  const rawItems = extractRawProcessListItems(envelope);
  const items = rawItems.map(normalizeProcessListRow).filter(Boolean);

  const root = envelope && typeof envelope === 'object' ? envelope : {};
  const meta = root.data !== undefined && !Array.isArray(root.data) && typeof root.data === 'object' ? root.data : root;

  const total = meta.total ?? meta.Total ?? items.length;
  const limit = meta.limit ?? meta.Limit ?? 20;
  const offset = meta.offset ?? meta.Offset ?? 0;

  return { items, total, limit, offset };
}

function engineAuthHeaders() {
  const h = {
    user: getMembershipUserHeaderString(),
    mode: getApiRequestMode(),
  };
  const auth = getSessionBearerAuthorization();
  if (auth) {
    h.Authorization = auth;
  }
  const branch = getBranchRequestHeaderValue();
  if (branch != null) {
    h.branch = branch;
  }
  return h;
}

function jsonHeaders() {
  return {
    ...engineAuthHeaders(),
    'Content-Type': 'application/json',
  };
}

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function extractErrorMessage(data, fallback) {
  if (typeof data.message === 'string' && data.message) return data.message;
  if (typeof data.error === 'string' && data.error) return data.error;
  return fallback;
}

function assertEngineSuccess(res, data, fallback) {
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, fallback));
  }
  if (data && Object.prototype.hasOwnProperty.call(data, 'status') && data.status !== 'success') {
    throw new Error(extractErrorMessage(data, fallback));
  }
}

const USER_FACING_TYPES = new Set([
  'USER_TASK',
  'UserTask',
  'SERVICE_REVIEW',
  'ServiceReview',
]);

const OPEN_STATUSES = new Set(['CREATED', 'Created', 'ACTIVE', 'Active', 'READY', 'Ready']);

function normalizeTaskType(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();
}

function normalizeTaskStatus(value) {
  return String(value ?? '').trim().toUpperCase();
}

/** tasks از API گاهی آرایه و گاهی map به‌کلید ID است */
export function normalizeTasksInput(tasks) {
  if (tasks == null) return [];
  if (Array.isArray(tasks)) return tasks.filter(Boolean);
  if (typeof tasks === 'object') return Object.values(tasks).filter(Boolean);
  return [];
}

export function tasksInputToIdMap(tasks) {
  const map = {};
  normalizeTasksInput(tasks).forEach((t) => {
    if (t?.ID != null) map[String(t.ID)] = t;
  });
  return map;
}

/** وقتی تسک بازی نیست: آخرین تغییر (برای ردیف لیست / فرایند تمام‌شده) */
export function pickFallbackLatestTouchTask(tasks) {
  const list = normalizeTasksInput(tasks);
  if (!list.length) return null;
  return [...list].sort(
    (a, b) =>
      new Date(b.UpdatedAt || b.CreatedAt || 0).getTime() -
      new Date(a.UpdatedAt || a.CreatedAt || 0).getTime(),
  )[0];
}

/** تسک «جاری» برای نمایش در لیست فرایندها — اول بازِ مواجه با کاربر به‌ترتیب BPMN، بعد fallback زمانی */
export function pickRepresentativeTaskForProcessRow(tasks) {
  const active = pickActiveUserFacingTask(tasksInputToIdMap(tasks));
  if (active) return active;
  return pickFallbackLatestTouchTask(tasks);
}

export async function fetchProcesses(params = {}) {
  const q = new URLSearchParams();
  if (params.limit != null) q.set('limit', String(params.limit));
  if (params.offset != null) q.set('offset', String(params.offset));
  const qs = q.toString();
  const url = `${ENGINE_BASE_URL}/api/engine/service/processes${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    headers: engineAuthHeaders(),
  });
  const data = await parseJson(res);
  assertEngineSuccess(res, data, 'دریافت لیست فرایندها ناموفق بود.');
  return normalizeFetchProcessesResult(data);
}

export async function deleteProcessInstance(processInstanceId) {
  const res = await fetch(`${ENGINE_BASE_URL}/api/engine/service/instance/${processInstanceId}`, {
    method: 'DELETE',
    headers: engineAuthHeaders(),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, 'حذف فرایند ناموفق بود.'));
  }
  if (data && Object.prototype.hasOwnProperty.call(data, 'status') && data.status !== 'success') {
    throw new Error(extractErrorMessage(data, 'حذف فرایند ناموفق بود.'));
  }
  return data;
}

export function pickActiveUserFacingTask(tasksMap) {
  if (!tasksMap || typeof tasksMap !== 'object') return null;
  const list = Object.values(tasksMap).filter(Boolean);
  const eligible = list.filter(
    (t) =>
      (normalizeTaskType(t.type) === 'USER_TASK' || normalizeTaskType(t.type) === 'SERVICE_REVIEW') &&
      (t.status == null || OPEN_STATUSES.has(normalizeTaskStatus(t.status))),
  );
  /* جلوترین مرحلهٔ باز در pipeline (رتبهٔ بزرگ‌تر)، نه کوچک‌ترین ID — تا با «شروع»/فرم قاطی نشود */
  eligible.sort((a, b) => {
    const ra = getService1WorkflowRank(a.element_id);
    const rb = getService1WorkflowRank(b.element_id);
    if (rb !== ra) return rb - ra;
    return (a.ID ?? 0) - (b.ID ?? 0);
  });
  return eligible[0] ?? null;
}

/**
 * آیا تسک جاری با حالت درخواست فعلی (`mode` هدر / sessionStorage) قابل تکمیل است؟
 * — مراحل SERVICE_REVIEW معمولاً شرکت؛ USER_TASK غیربررسی معمولاً شعبه/موبایل.
 * — در صورت وجود `attached_data.ui_actionable_by` یا `engine.actionable_by` با مقادیر branch|company|mobile همان اعمال می‌شود.
 */
export function canCurrentClientCompleteTask(task) {
  if (!task || typeof task !== 'object') return true;
  if (task.__syntheticRejectedAnchor || task.__syntheticStart || task.__inferredForStartStep) {
    return true;
  }

  const mode = getApiMode();
  const requestMode = getApiRequestMode();
  const ad = task.attached_data && typeof task.attached_data === 'object' ? task.attached_data : {};
  const engine = ad.engine && typeof ad.engine === 'object' ? ad.engine : {};
  const hint = ad.ui_actionable_by ?? ad.actionable_by ?? engine.actionable_by ?? engine.ui_actionable_by;
  if (hint === 'branch' || hint === 'company' || hint === 'mobile') {
    return hint === requestMode || (hint === 'company' && mode === 'central');
  }

  const typeNorm = String(task.type ?? '')
    .trim()
    .replace(/\s+/g, '');
  const isReviewType = typeNorm === 'SERVICE_REVIEW' || typeNorm === 'ServiceReview';
  const isReviewStep = isReviewElementId(task.element_id) || isReviewType;

  if (isReviewStep) {
    return requestMode === 'company';
  }

  if (requestMode === 'company') {
    return false;
  }
  return mode === 'branch' || mode === 'mobile';
}

function normEl(elementId) {
  return String(elementId ?? '')
    .trim()
    .toLowerCase();
}

export async function fetchProcessTasks(processInstanceId) {
  const res = await fetch(`${ENGINE_BASE_URL}/api/engine/service/tasks/${processInstanceId}`, {
    headers: engineAuthHeaders(),
  });
  const data = await parseJson(res);
  assertEngineSuccess(res, data, 'دریافت وظایف فرایند ناموفق بود.');
  return data.tasks ?? {};
}

/** آخرین نسخهٔ تسک برای یک element_id از نقشهٔ tasks پاسخ API */
export function pickLatestTaskForElement(tasksMap, elementId) {
  if (!tasksMap || !elementId) return null;
  const want = normEl(elementId);
  const list = Object.values(tasksMap).filter((t) => t && normEl(t.element_id) === want);
  if (list.length === 0) return null;
  return list.sort(
    (a, b) =>
      new Date(b.UpdatedAt || b.CreatedAt || 0).getTime() -
      new Date(a.UpdatedAt || a.CreatedAt || 0).getTime(),
  )[0];
}

function isDoneStatus(status) {
  return String(status || '').toUpperCase() === 'DONE';
}

/** آخرین تسک DONE یک element (برای خواندن نظر بررسی از attached_data) */
export function pickLatestDoneTaskForElement(tasksMap, elementId) {
  if (!tasksMap || !elementId) return null;
  const want = normEl(elementId);
  const list = Object.values(tasksMap).filter(
    (t) => t && normEl(t.element_id) === want && isDoneStatus(t.status),
  );
  if (list.length === 0) return null;
  return list.sort(
    (a, b) =>
      new Date(b.completed_at || b.UpdatedAt || b.CreatedAt || 0).getTime() -
      new Date(a.completed_at || a.UpdatedAt || a.CreatedAt || 0).getTime(),
  )[0];
}

/** هم‌راستا با UI فرم۱: pending | approved | rejected | needs_correction */
export function normalizeService1ReviewStatus(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
  if (s === 'approved' || s === 'approve') return 'approved';
  if (s === 'rejected' || s === 'reject') return 'rejected';
  if (s === 'needs_correction' || s === 'need_correction' || s === 'correction') return 'needs_correction';
  return 'pending';
}

/** اولین مقدار غیرخالی (پس از trim) از چند مسیر متداول attached_data */
function pickFirstReviewComment(...parts) {
  for (let i = 0; i < parts.length; i += 1) {
    const t = String(parts[i] ?? '').trim();
    if (t) return t;
  }
  return '';
}

/**
 * استخراج نظر بررسی مرکزی از attached_data تسک موتور.
 * مسیرهای متداول: review_comment، form.review_comment، attached.comment، reject.comment، system.central_reject_*، …
 */
export function parseAttachedDataForReviewFeedback(attachedData) {
  const ad = attachedData;
  if (!ad || typeof ad !== 'object') return { status: 'pending', comment: '' };

  const form = ad.form && typeof ad.form === 'object' ? ad.form : {};
  const prev = ad.previous_submission && typeof ad.previous_submission === 'object' ? ad.previous_submission : {};
  const attachedBlock = ad.attached && typeof ad.attached === 'object' ? ad.attached : {};
  const system = ad.system && typeof ad.system === 'object' ? ad.system : {};
  const rejectBlock = ad.reject && typeof ad.reject === 'object' ? ad.reject : {};
  const centralPayload =
    system.central_reject_payload && typeof system.central_reject_payload === 'object'
      ? system.central_reject_payload
      : {};

  const comment = pickFirstReviewComment(
    ad.review_comment,
    ad.reviewer_comment,
    ad.central_review_comment,
    ad.correction_comment,
    form.review_comment,
    prev.review_comment,
    attachedBlock.comment,
    rejectBlock.comment,
    system.central_reject_reason,
    centralPayload.comment,
    ad.comment,
  );

  const raw =
    ad.review_status ?? form.review_status ?? prev.review_status ?? ad.decision ?? ad.review_decision ?? '';

  let status = normalizeService1ReviewStatus(raw);
  if (status === 'pending' && (ad.needs_correction === true || ad.correction_required === true)) {
    status = 'needs_correction';
  }
  const hasCentralReject =
    String(system.central_reject_reason ?? '').trim() !== '' ||
    String(centralPayload.comment ?? '').trim() !== '';
  if (status === 'pending' && hasCentralReject) {
    status = 'rejected';
  }

  return { status, comment };
}

function parseReviewNodeFeedback(node, fallbackStatus = 'pending') {
  const n = node && typeof node === 'object' ? node : {};
  const rejectPayload =
    n.reject_payload && typeof n.reject_payload === 'object' ? n.reject_payload : {};
  const comment = pickFirstReviewComment(
    n.comment,
    n.reject_reason,
    rejectPayload.comment,
    n.review_comment,
    n.reviewer_comment,
  );
  const explicitStatus = normalizeService1ReviewStatus(
    n.status ?? n.review_status ?? n.decision ?? n.review_decision ?? '',
  );

  // وقتی reject_payload داریم یعنی فرم برای اصلاح برگشته است.
  if (rejectPayload.comment != null || Object.keys(rejectPayload).length > 0) {
    return { status: 'needs_correction', comment };
  }

  return { status: explicitStatus === 'pending' ? fallbackStatus : explicitStatus, comment };
}

/** برای نمایش بلوک «نتیجه بررسی» در پر کردن فرم ۱ بعد از اصلاح */
export function buildForm1ReviewStateFromTasksMap(tasksMap) {
  const doneReview = pickLatestDoneTaskForElement(tasksMap, 'review1');
  if (doneReview) {
    const r = parseAttachedDataForReviewFeedback(doneReview.attached_data);
    if (r.comment || r.status !== 'pending') return r;
  }

  const form1 = pickLatestTaskForElement(tasksMap, 'form1');
  if (form1) {
    const ad = form1.attached_data && typeof form1.attached_data === 'object' ? form1.attached_data : {};
    const review1Node = ad.review1 && typeof ad.review1 === 'object' ? ad.review1 : null;
    if (review1Node) {
      const fromReviewNode = parseReviewNodeFeedback(review1Node);
      if (fromReviewNode.comment || fromReviewNode.status !== 'pending') {
        return fromReviewNode;
      }
    }
    const r = parseAttachedDataForReviewFeedback(form1.attached_data);
    if (r.comment && r.status === 'pending') {
      return { ...r, status: 'needs_correction' };
    }
    return r;
  }

  return { status: 'pending', comment: '' };
}

function pickLatestDoneCentralForm2ReviewTask(tasksMap) {
  const a = pickLatestDoneTaskForElement(tasksMap, 'review2');
  const b = pickLatestDoneTaskForElement(tasksMap, 'centralReviewForm2');
  if (!a) return b;
  if (!b) return a;
  const ta = new Date(a.completed_at || a.UpdatedAt || a.CreatedAt || 0).getTime();
  const tb = new Date(b.completed_at || b.UpdatedAt || b.CreatedAt || 0).getTime();
  return ta >= tb ? a : b;
}

/** برای نمایش بلوک بررسی در پر کردن فرم ۲ */
export function buildForm2ReviewStateFromTasksMap(tasksMap) {
  const doneCentral = pickLatestDoneCentralForm2ReviewTask(tasksMap);
  if (doneCentral) {
    const r = parseAttachedDataForReviewFeedback(doneCentral.attached_data);
    if (r.comment || r.status !== 'pending') return r;
  }

  const form2 = pickLatestTaskForElement(tasksMap, 'form2');
  if (form2) {
    const ad = form2.attached_data && typeof form2.attached_data === 'object' ? form2.attached_data : {};
    const review2Node =
      (ad.review2 && typeof ad.review2 === 'object' ? ad.review2 : null) ||
      (ad.centralReviewForm2 && typeof ad.centralReviewForm2 === 'object' ? ad.centralReviewForm2 : null);
    if (review2Node) {
      const fromReviewNode = parseReviewNodeFeedback(review2Node);
      if (fromReviewNode.comment || fromReviewNode.status !== 'pending') {
        return fromReviewNode;
      }
    }
    const r = parseAttachedDataForReviewFeedback(form2.attached_data);
    if (r.comment && r.status === 'pending') {
      return { ...r, status: 'needs_correction' };
    }
    return r;
  }

  return { status: 'pending', comment: '' };
}

/** ادغام همهٔ تسک‌های برگشتی API در یک map به‌کلید شناسهٔ تسک (آخرین نسخه بر اساس UpdatedAt) */
export function mergeAllTasksByTaskId(prevIdMap, taskMap) {
  const next = { ...(prevIdMap || {}) };
  Object.values(taskMap || {}).forEach((t) => {
    if (t == null || t.ID == null) return;
    const k = String(t.ID);
    const old = next[k];
    const newTs = new Date(t.UpdatedAt || t.CreatedAt || 0).getTime();
    const oldTs = new Date(old?.UpdatedAt || old?.CreatedAt || 0).getTime();
    if (!old || newTs >= oldTs) {
      next[k] = { ...t };
    }
  });
  return next;
}

/** همهٔ نسخه‌های تسک یک element_id مرتب‌شده از قدیم به جدید */
export function getTaskVersionsForElement(idMap, elementId) {
  if (!elementId || !idMap) return [];
  const want = normEl(elementId);
  return Object.values(idMap)
    .filter((t) => t && normEl(t.element_id) === want)
    .sort((a, b) => new Date(a.CreatedAt || 0) - new Date(b.CreatedAt || 0));
}

/** قدیمی‌ترین تسک در map (زمان) — فقط اگر نیاز به fallback زمانی باشد */
export function pickEarliestTaskFromIdMap(idMap) {
  const list = Object.values(idMap || {}).filter(Boolean);
  if (!list.length) return null;
  return list.sort((a, b) => new Date(a.CreatedAt || 0) - new Date(b.CreatedAt || 0))[0];
}

/** نزدیک‌ترین مرحله به ابتدای pipeline (برای «شروع» وقتی تسک start در API نیست) — نه صرفاً قدیمی‌ترین زمان */
export function pickPipelineEarliestTaskFromIdMap(idMap) {
  const list = Object.values(idMap || {}).filter(Boolean);
  if (!list.length) return null;
  return list.sort((a, b) => {
    const ra = getService1WorkflowRank(a.element_id);
    const rb = getService1WorkflowRank(b.element_id);
    if (ra !== rb) return ra - rb;
    return new Date(a.CreatedAt || 0) - new Date(b.CreatedAt || 0);
  })[0];
}

const SNAPSHOT_PREFIX = 'service1.tasksSnapshot.';

export function readService1TasksSnapshotMap(processInstanceId) {
  if (processInstanceId == null || typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(`${SNAPSHOT_PREFIX}${processInstanceId}`);
    if (!raw) return {};
    return tasksInputToIdMap(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function writeService1TasksSnapshot(processInstanceId, tasksInput) {
  if (processInstanceId == null || typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${SNAPSHOT_PREFIX}${processInstanceId}`, JSON.stringify(tasksInput ?? {}));
  } catch {
    /* ignore quota */
  }
}

const PROCESS_META_PREFIX = 'service1.processMeta.';

/** برای تشخیص رد فرایند وقتی GET instance در دسترس نیست (مثلاً بعد از بازگشت از لیست) */
export function readService1ProcessMeta(processInstanceId) {
  if (processInstanceId == null || typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`${PROCESS_META_PREFIX}${processInstanceId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeService1ProcessMeta(processInstanceId, meta) {
  if (processInstanceId == null || typeof window === 'undefined') return;
  try {
    if (meta == null) {
      sessionStorage.removeItem(`${PROCESS_META_PREFIX}${processInstanceId}`);
      return;
    }
    sessionStorage.setItem(`${PROCESS_META_PREFIX}${processInstanceId}`, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

export function clearService1ProcessMeta(processInstanceId) {
  writeService1ProcessMeta(processInstanceId, null);
}

/**
 * پاسخ reject/process یا آبجکت process از لیست/GET — اگر رد شده باشد پیام را برمی‌گرداند.
 * @returns {{ rejected: true, comment: string } | null}
 */
export function parseEngineProcessRejectState(envelope) {
  if (!envelope || typeof envelope !== 'object') return null;
  const status = String(envelope.status ?? envelope.process_status ?? '').toUpperCase();
  const lastAction = String(envelope.last_action ?? '').toUpperCase();
  const vars = envelope.variables && typeof envelope.variables === 'object' ? envelope.variables : {};
  const rejected =
    envelope.is_rejected === true ||
    status === 'REJECTED' ||
    lastAction === 'REJECT';
  if (!rejected) return null;
  const payload = vars.central_reject_payload;
  const fromPayload =
    payload && typeof payload === 'object' && payload.comment != null
      ? String(payload.comment).trim()
      : '';
  const comment =
    String(vars.central_reject_reason ?? '').trim() ||
    fromPayload ||
    String(envelope.message ?? '').trim();
  return { rejected: true, comment };
}

/** GET یک نمونه فرایند (در صورت پشتیبانی بک‌اند); در خطا null */
export async function fetchProcessInstance(processInstanceId) {
  if (processInstanceId == null) return null;
  try {
    const res = await fetch(`${ENGINE_BASE_URL}/api/engine/service/instance/${processInstanceId}`, {
      method: 'GET',
      headers: engineAuthHeaders(),
    });
    const data = await parseJson(res);
    if (!res.ok) return null;
    if (data && data.status === 'success' && data.data != null) return data.data;
    return data?.data ?? data?.process ?? (typeof data === 'object' ? data : null);
  } catch {
    return null;
  }
}

/** ادغام: حافظهٔ قبلی + snapshot لیست + پاسخ تازهٔ API (بازهٔ زمانی/حذف DONE در API جبران می‌شود) */
export function mergeApiTasksWithSnapshot(processInstanceId, prevIdMap, apiTasksInput) {
  const snap = readService1TasksSnapshotMap(processInstanceId);
  const apiMap = tasksInputToIdMap(apiTasksInput);
  return mergeAllTasksByTaskId(mergeAllTasksByTaskId(prevIdMap || {}, snap), apiMap);
}

export async function completeTaskForm(processInstanceId, taskId, body) {
  const res = await fetch(
    `${ENGINE_BASE_URL}/api/engine/service/task/form/${processInstanceId}/${taskId}`,
    {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(body ?? {}),
    },
  );
  const data = await parseJson(res);
  assertEngineSuccess(res, data, 'ثبت اطلاعات مرحله ناموفق بود.');
  return data;
}

/** نیاز به اصلاح — رد مرحله (برگشت به مرحله قبل)؛ بدنه `{ comment }` */
export async function rejectServiceStep(processInstanceId, taskId, body) {
  const res = await fetch(
    `${ENGINE_BASE_URL}/api/engine/service/reject/step/${processInstanceId}/${taskId}`,
    {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ comment: body?.comment ?? '' }),
    },
  );
  const data = await parseJson(res);
  assertEngineSuccess(res, data, 'ثبت رد مرحله در موتور ناموفق بود.');
  return data;
}

/** رد کل فرایند؛ بدنه `{ comment }` — توضیح رد در API الزامی است */
export async function rejectProcess(processInstanceId, body) {
  const comment = String(body?.comment ?? '').trim();
  if (!comment) {
    throw new Error('ارسال توضیح / دلیل رد فرایند الزامی است.');
  }
  const res = await fetch(`${ENGINE_BASE_URL}/api/engine/service/reject/process/${processInstanceId}`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ comment }),
  });
  const data = await parseJson(res);
  assertEngineSuccess(res, data, 'رد فرایند در موتور ناموفق بود.');
  return data;
}

/** برای ارسال به task/form — File و موارد غیرقابل JSON حذف/تبدیل می‌شوند */
export function sanitizeValuesForEngineJson(value) {
  if (value == null) return value;
  if (typeof File !== 'undefined' && value instanceof File) {
    return value.name || '';
  }
  if (typeof FileList !== 'undefined' && value instanceof FileList) {
    return Array.from(value)
      .map((f) => f.name)
      .filter(Boolean)
      .join(',');
  }
  if (Array.isArray(value)) return value.map(sanitizeValuesForEngineJson);
  if (typeof value === 'object' && !(value instanceof Date)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitizeValuesForEngineJson(v);
    }
    return out;
  }
  return value;
}

export async function advanceTaskNext(processInstanceId, taskId, body = { approved: true }) {
  const res = await fetch(
    `${ENGINE_BASE_URL}/api/engine/service/next/${processInstanceId}/${taskId}`,
    {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(body ?? { approved: true }),
    },
  );
  const data = await parseJson(res);
  assertEngineSuccess(res, data, 'رفتن به مرحله بعد ناموفق بود.');
  return data;
}
