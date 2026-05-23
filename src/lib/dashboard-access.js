import { paths } from 'src/routes/paths';

import { canViewBranchDashboard } from 'src/lib/dashboard-nav-permissions';
import { PERM, userHasAnyPermission, userHasPermission } from 'src/lib/permissions';

const DASHBOARD_ROOT = paths.dashboard.root;

/** مسیر ویرایش شعبه مرکزی برای مدیر مستأجر (شعبه متصل به کاربر) */
export function tenantCentralBranchPath(user) {
  const id = Number(user?.branch_id ?? user?.BranchID ?? 0);
  if (id > 0) {
    return paths.dashboard.branch.edit(id);
  }
  return paths.dashboard.branch.search;
}

/** مسیرهای مجاز برای مدیر شعبه مرکزی (مستأجر) */
function tenantAllowedPrefixes(user) {
  const editPath = tenantCentralBranchPath(user);
  return [DASHBOARD_ROOT, paths.dashboard.branch.overview, paths.dashboard.branch.search, paths.dashboard.branch.create, editPath, `${DASHBOARD_ROOT}/branch`];
}

export function getDashboardAccessRedirect(pathname, user) {
  const path = String(pathname ?? '');

  if (
    (path === paths.dashboard.branch.overview || path.startsWith(`${paths.dashboard.branch.overview}/`)) &&
    !canViewBranchDashboard(user)
  ) {
    return DASHBOARD_ROOT;
  }

  const isTenantOnly =
    userHasPermission(user, PERM.ui.companyTenantManage) &&
    !userHasAnyPermission(user, [PERM.ui.branchCentralList, PERM.ui.branchCentralCreate]);

  if (isTenantOnly) {
    const home = tenantCentralBranchPath(user);
    if (path === DASHBOARD_ROOT || path === `${DASHBOARD_ROOT}/`) {
      return home;
    }
    if (path === paths.dashboard.branch.centralManage || path.startsWith(`${paths.dashboard.branch.centralManage}/`)) {
      return home;
    }
    const allowed = tenantAllowedPrefixes(user).some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`)
    );
    if (!allowed) {
      return home;
    }
    return null;
  }

  if (path === paths.dashboard.branch.centralManage || path.startsWith(`${paths.dashboard.branch.centralManage}/`)) {
    return paths.dashboard.branch.search;
  }

  return null;
}

export function isCentralBranchTenantUser(user) {
  return userHasPermission(user, PERM.ui.companyTenantManage);
}

/** @deprecated */
export function isCompanyAdminUser(user) {
  return isCentralBranchTenantUser(user);
}
