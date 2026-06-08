import { paths } from 'src/routes/paths';

import { isCentralAdmin } from 'src/lib/admin-access';
import { canViewBranchDashboard, canViewBranchUserDashboard } from 'src/lib/dashboard-nav-permissions';
import { userHasAllPermissions, userHasAnyPermission } from 'src/lib/permissions';

/**
 * Filters dashboard nav by permission slugs on each item.
 * @param {typeof import('./nav-config-dashboard').navData} navData
 * @param {object|null|undefined} user
 */
export function filterNavByPermissions(navData, user) {
  if (!Array.isArray(navData)) {
    return navData;
  }

  const filterItems = (items) =>
    (items || [])
      .map((item) => {
        if (item.path === paths.dashboard.branch.overview && !canViewBranchDashboard(user)) {
          return null;
        }
        if (item.path === paths.dashboard.branch.userOverview && !canViewBranchUserDashboard(user)) {
          return null;
        }
        if (item.centralAdminOnly && !isCentralAdmin(user)) {
          return null;
        }
        if (item.requiredPermissions?.length && !userHasAllPermissions(user, item.requiredPermissions)) {
          return null;
        }
        if (item.anyPermissions?.length && !userHasAnyPermission(user, item.anyPermissions)) {
          return null;
        }
        if (item.children?.length) {
          const children = filterItems(item.children);
          if (children.length === 0) {
            return null;
          }
          return { ...item, children };
        }
        return item;
      })
      .filter(Boolean);

  return navData
    .map((section) => {
      const items = filterItems(section.items);
      if (!items.length) {
        return null;
      }
      return { ...section, items };
    })
    .filter(Boolean);
}
