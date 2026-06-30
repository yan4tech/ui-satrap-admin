import { paths } from 'src/routes/paths';
import { userHasPermission } from 'src/lib/permissions';
import {
  PROCESS_KEY_TO_UI_PERMISSION,
  servicePathForProcessKey,
} from 'src/lib/service-entitlement-api';

const SERVICE_NAV_PATHS = new Set([
  paths.dashboard.services.one,
  paths.dashboard.services.two,
  paths.dashboard.services.three,
  paths.dashboard.services.four,
]);

const UI_SERVICE_PERM_TO_PATH = Object.entries(PROCESS_KEY_TO_UI_PERMISSION).map(
  ([processKey, perm]) => [perm, servicePathForProcessKey(processKey)]
);

/**
 * در حالت شعبه، آیتم‌های منوی خدمات را بر اساس process_keyهای مجاز فیلتر می‌کند.
 * دسترسی‌های UI (ui.services.*) هم مسیر مربوط را مجاز می‌کنند.
 * @param {typeof import('./nav-config-dashboard').navData} navData
 * @param {{ active: boolean, processKeys: string[], user?: object|null }} options
 */
export function filterNavByEntitledServices(navData, { active, processKeys, user }) {
  if (!active || !Array.isArray(navData)) {
    return navData;
  }

  const allowedPaths = new Set(
    processKeys.map((k) => servicePathForProcessKey(k)).filter(Boolean)
  );
  allowedPaths.add(paths.dashboard.services.inbox);
  allowedPaths.add(paths.dashboard.services.list);

  for (const [perm, path] of UI_SERVICE_PERM_TO_PATH) {
    if (userHasPermission(user, perm)) {
      allowedPaths.add(path);
    }
  }

  const filterItems = (items) =>
    (items || [])
      .map((item) => {
        if (item.children?.length) {
          const children = filterItems(item.children);
          if (children.length === 0 && SERVICE_NAV_PATHS.has(item.path)) {
            return null;
          }
          return { ...item, children };
        }
        if (item.path && SERVICE_NAV_PATHS.has(item.path) && !allowedPaths.has(item.path)) {
          return null;
        }
        return item;
      })
      .filter(Boolean);

  return navData.map((section) => ({
    ...section,
    items: filterItems(section.items),
  }));
}
