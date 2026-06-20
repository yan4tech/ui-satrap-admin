import { paths } from 'src/routes/paths';

/**
 * مسیر کلیک اعلان — همان الگوی «مشاهده کار» در صندوق کار (صفحهٔ خدمت + processId).
 */
export function resolveNotificationHref(notification) {
  const pid = notification?.processInstanceId ?? notification?.process_instance_id;
  const tid = notification?.taskId ?? notification?.task_id;
  const def = String(notification?.definitionKey ?? notification?.definition_key ?? 'service1').trim() || 'service1';

  if (pid != null && String(pid).trim() !== '') {
    const q = new URLSearchParams();
    q.set('processId', String(pid));
    q.set('definitionKey', def);
    if (tid != null && String(tid).trim() !== '') {
      q.set('taskId', String(tid));
    }

    let base = paths.dashboard.services.one;
    if (def === 'service2') base = paths.dashboard.services.two;
    else if (def === 'service3') base = paths.dashboard.services.three;
    else if (def === 'service4') base = paths.dashboard.services.four;

    return `${base}?${q.toString()}`;
  }

  const raw = notification?.actionPath ?? notification?.action_path;
  if (raw && typeof raw === 'string') {
    if (raw.includes('processId=') && raw.includes('/inbox')) {
      try {
        const url = new URL(raw, 'http://local');
        const processId = url.searchParams.get('processId');
        const taskId = url.searchParams.get('taskId');
        if (processId) {
          return resolveNotificationHref({
            processInstanceId: processId,
            taskId,
            definitionKey: def,
          });
        }
      } catch {
        /* fall through */
      }
    }
    return raw;
  }

  return paths.dashboard.services.inbox;
}
