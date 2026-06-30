import { ENGINE_BASE_URL, engineApiUrl, jsonHeaders } from 'src/app/dashboard/services/one/engine-api';

/** هم‌مسیر با سایر APIهای موتور (work-inbox، processes، …) */
const NOTIFICATIONS_API = engineApiUrl('/service/notifications');

const NOTIF_READ_STORAGE_KEY = 'in_app_notifications_read_v1';

function readPersistedKeys() {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.sessionStorage.getItem(NOTIF_READ_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

/** کلید منطقی یک اعلان (برای ردیف‌های تکراری user/branch) */
export function notificationLogicalKey(n) {
  if (!n || typeof n !== 'object') return '';
  const pid = n.processInstanceId ?? n.process_instance_id ?? '';
  const et = n.eventType ?? n.event_type ?? n.type ?? '';
  const title = n.title ?? '';
  return `${pid}|${et}|${title}`;
}

export function persistNotificationRead(notification) {
  if (typeof window === 'undefined' || !notification) return;
  const keys = readPersistedKeys();
  if (notification.id != null) keys.add(String(notification.id));
  const lk = notificationLogicalKey(notification);
  if (lk) keys.add(lk);
  try {
    window.sessionStorage.setItem(NOTIF_READ_STORAGE_KEY, JSON.stringify([...keys]));
  } catch {
    /* ignore */
  }
}

export function applyPersistedReadState(items) {
  const keys = readPersistedKeys();
  if (!keys.size) return items;
  return items.map((n) => {
    const idKey = n.id != null ? String(n.id) : '';
    const lk = notificationLogicalKey(n);
    if ((idKey && keys.has(idKey)) || (lk && keys.has(lk))) {
      return { ...n, isUnRead: false };
    }
    return n;
  });
}

export function countUnreadNotifications(items) {
  return items.filter((n) => n.isUnRead && !n.isArchived).length;
}

export function countReadNotifications(items) {
  return items.filter((n) => !n.isUnRead && !n.isArchived).length;
}

/** ادغام خوانده‌شدهٔ محلی + sessionStorage پس از هر fetch تا polling تب را خراب نکند */
export function mergeNotificationsWithReadState(incoming, previousItems = []) {
  const keys = readPersistedKeys();
  const prevReadIds = new Set(
    (previousItems || []).filter((n) => !n.isUnRead).map((n) => String(n.id))
  );
  const prevReadKeys = new Set(
    (previousItems || [])
      .filter((n) => !n.isUnRead)
      .map((n) => notificationLogicalKey(n))
      .filter(Boolean)
  );

  return (incoming || []).map((n) => {
    const idKey = n.id != null ? String(n.id) : '';
    const lk = notificationLogicalKey(n);
    const isRead =
      (idKey && keys.has(idKey)) ||
      (lk && keys.has(lk)) ||
      (idKey && prevReadIds.has(idKey)) ||
      (lk && prevReadKeys.has(lk));
    return isRead ? { ...n, isUnRead: false } : n;
  });
}

function unwrapData(envelope) {
  const root = envelope && typeof envelope === 'object' ? envelope : {};
  return root.data !== undefined ? root.data : root;
}

export async function fetchNotifications(tab = 'all') {
  const params = new URLSearchParams({ tab, limit: '50', offset: '0' });
  let res;
  try {
    res = await fetch(`${NOTIFICATIONS_API}?${params}`, {
      headers: jsonHeaders(),
    });
  } catch (e) {
    const hint = !ENGINE_BASE_URL
      ? ' آیا سرویس engine (پورت 3503) یا nginx در حال اجراست؟'
      : '';
    throw new Error(
      `اتصال به API اعلان‌ها برقرار نشد (${ENGINE_BASE_URL}).${hint} ${e?.message || ''}`.trim()
    );
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `بارگذاری اعلان‌ها ناموفق بود (${res.status})`);
  }
  const json = await res.json();
  const data = unwrapData(json);
  const rawItems = Array.isArray(data?.items) ? data.items.map(normalizeNotification) : [];
  const items = mergeNotificationsWithReadState(rawItems);
  return {
    items,
    unreadCount: countUnreadNotifications(items),
    readCount: countReadNotifications(items),
    archivedCount: Number(data?.archived_count ?? data?.archivedCount ?? 0),
    allCount: Number(data?.all_count ?? data?.allCount ?? items.length),
  };
}

export async function markNotificationRead(id) {
  const res = await fetch(`${NOTIFICATIONS_API}/${id}/read`, {
    method: 'POST',
    headers: jsonHeaders(),
  });
  if (!res.ok) {
    throw new Error(`علامت‌گذاری خوانده‌شده ناموفق بود (${res.status})`);
  }
}

export async function markAllNotificationsRead() {
  const res = await fetch(`${NOTIFICATIONS_API}/read-all`, {
    method: 'POST',
    headers: jsonHeaders(),
  });
  if (!res.ok) {
    throw new Error(`علامت‌گذاری همه ناموفق بود (${res.status})`);
  }
}

/**
 * SSE for live notifications. Skipped when user header is too large for query string.
 * @returns {() => void} cleanup
 */
export function subscribeNotificationStream(onEvent) {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  const headers = jsonHeaders();
  const user = headers.user || '';
  if (!user || user.length > 1500) {
    return () => {};
  }

  const params = new URLSearchParams();
  params.set('user', user);
  if (headers.branch) params.set('branch', headers.branch);

  const url = `${NOTIFICATIONS_API}/stream?${params}`;
  const es = new EventSource(url);

  es.addEventListener('notification', (ev) => {
    try {
      const raw = JSON.parse(ev.data);
      onEvent(normalizeNotification(raw));
    } catch {
      /* ignore */
    }
  });

  es.onerror = () => {
    es.close();
  };

  return () => es.close();
}

/** @param {Record<string, unknown>} raw */
export function normalizeNotification(raw) {
  const created =
    raw.createdAt ?? raw.created_at ?? raw.CreatedAt ?? new Date().toISOString();
  return {
    id: raw.id ?? raw.ID,
    type: raw.type ?? mapEventToType(raw.event_type ?? raw.eventType),
    eventType: raw.event_type ?? raw.eventType,
    category: raw.category ?? 'سیستم',
    title: raw.title ?? '',
    body: raw.body ?? '',
    isUnRead:
      raw.isUnRead !== undefined
        ? Boolean(raw.isUnRead)
        : raw.is_read !== undefined
          ? !raw.is_read
          : true,
    isArchived: raw.isArchived ?? raw.archived_at != null,
    createdAt: typeof created === 'string' ? created : new Date().toISOString(),
    processInstanceId: raw.process_instance_id ?? raw.processInstanceId,
    taskId: raw.task_id ?? raw.taskId,
    definitionKey: raw.definition_key ?? raw.definitionKey,
    actionLabel: raw.action_label ?? raw.actionLabel ?? 'مشاهده',
    actionPath: raw.action_path ?? raw.actionPath ?? '/dashboard/services/inbox',
  };
}

function mapEventToType(eventType) {
  switch (eventType) {
    case 'NEW_TASK':
      return 'task';
    case 'NEEDS_CORRECTION':
      return 'correction';
    case 'PROCESS_LOCK':
      return 'lock';
    case 'EXTERNAL_RESPONSE':
      return 'integration';
    default:
      return 'task';
  }
}
