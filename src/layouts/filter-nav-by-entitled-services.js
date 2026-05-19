import { paths } from 'src/routes/paths';
import { servicePathForProcessKey } from 'src/lib/service-entitlement-api';

const SERVICE_NAV_PATHS = new Set([
  paths.dashboard.services.one,
  paths.dashboard.services.two,
  paths.dashboard.services.three,
]);

/**
 * در حالت شعبه، آیتم‌های منوی خدمات را بر اساس process_keyهای مجاز فیلتر می‌کند.
 * @param {typeof import('./nav-config-dashboard').navData} navData
 * @param {{ active: boolean, processKeys: string[] }} options
 */
export function filterNavByEntitledServices(navData, { active, processKeys }) {
  if (!active || !Array.isArray(navData)) {
    return navData;
  }

  const allowedPaths = new Set(
    processKeys.map((k) => servicePathForProcessKey(k)).filter(Boolean)
  );
  allowedPaths.add(paths.dashboard.services.list);

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
