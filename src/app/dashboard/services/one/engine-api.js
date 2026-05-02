import { HARDCODED_USER_HEADER } from './start-service-api';

/** TODO: env */
export const ENGINE_BASE_URL = 'http://localhost:3503';

const jsonHeaders = {
  'Content-Type': 'application/json',
  user: HARDCODED_USER_HEADER,
};

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

export async function fetchProcesses(params = {}) {
  const q = new URLSearchParams();
  if (params.limit != null) q.set('limit', String(params.limit));
  if (params.offset != null) q.set('offset', String(params.offset));
  const qs = q.toString();
  const url = `${ENGINE_BASE_URL}/api/engine/service/processes${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    headers: { user: HARDCODED_USER_HEADER },
  });
  const data = await parseJson(res);
  assertEngineSuccess(res, data, 'دریافت لیست فرایندها ناموفق بود.');
  return data.data ?? { items: [], total: 0, limit: 20, offset: 0 };
}

export async function deleteProcessInstance(processInstanceId) {
  const res = await fetch(`${ENGINE_BASE_URL}/api/engine/service/instance/${processInstanceId}`, {
    method: 'DELETE',
    headers: { user: HARDCODED_USER_HEADER },
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
      USER_FACING_TYPES.has(t.type) &&
      (t.status == null || OPEN_STATUSES.has(String(t.status))),
  );
  eligible.sort((a, b) => (a.ID ?? 0) - (b.ID ?? 0));
  return eligible[0] ?? null;
}

export async function fetchProcessTasks(processInstanceId) {
  const res = await fetch(`${ENGINE_BASE_URL}/api/engine/service/tasks/${processInstanceId}`, {
    headers: { user: HARDCODED_USER_HEADER },
  });
  const data = await parseJson(res);
  assertEngineSuccess(res, data, 'دریافت وظایف فرایند ناموفق بود.');
  return data.tasks ?? {};
}

/** آخرین نسخهٔ تسک برای یک element_id از نقشهٔ tasks پاسخ API */
export function pickLatestTaskForElement(tasksMap, elementId) {
  if (!tasksMap || !elementId) return null;
  const list = Object.values(tasksMap).filter((t) => t && t.element_id === elementId);
  if (list.length === 0) return null;
  return list.sort(
    (a, b) =>
      new Date(b.UpdatedAt || b.CreatedAt || 0).getTime() -
      new Date(a.UpdatedAt || a.CreatedAt || 0).getTime(),
  )[0];
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
  return Object.values(idMap)
    .filter((t) => t && t.element_id === elementId)
    .sort((a, b) => new Date(a.CreatedAt || 0) - new Date(b.CreatedAt || 0));
}

/** قدیمی‌ترین تسک در map (برای نمایش مرحلهٔ «شروع» وقتی تسک start در API نیست) */
export function pickEarliestTaskFromIdMap(idMap) {
  const list = Object.values(idMap || {}).filter(Boolean);
  if (!list.length) return null;
  return list.sort((a, b) => new Date(a.CreatedAt || 0) - new Date(b.CreatedAt || 0))[0];
}

export async function completeTaskForm(processInstanceId, taskId, body) {
  const res = await fetch(
    `${ENGINE_BASE_URL}/api/engine/service/task/form/${processInstanceId}/${taskId}`,
    {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(body ?? {}),
    },
  );
  const data = await parseJson(res);
  assertEngineSuccess(res, data, 'ثبت اطلاعات مرحله ناموفق بود.');
  return data;
}

export async function advanceTaskNext(processInstanceId, taskId, body = { approved: true }) {
  const res = await fetch(
    `${ENGINE_BASE_URL}/api/engine/service/next/${processInstanceId}/${taskId}`,
    {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(body ?? { approved: true }),
    },
  );
  const data = await parseJson(res);
  assertEngineSuccess(res, data, 'رفتن به مرحله بعد ناموفق بود.');
  return data;
}
