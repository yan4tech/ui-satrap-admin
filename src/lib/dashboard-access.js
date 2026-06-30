import { paths } from 'src/routes/paths';

import { PERM, userHasPermission, userHasAnyPermission } from 'src/lib/permissions';
import { canViewBranchDashboard, canViewBranchUserDashboard } from 'src/lib/dashboard-nav-permissions';

const DASHBOARD_ROOT = paths.dashboard.root;

function isBranchOverviewPath(path) {
  return (
    path === paths.dashboard.branch.overview ||
    path.startsWith(`${paths.dashboard.branch.overview}/`)
  );
}

function isBranchUserOverviewPath(path) {
  return (
    path === paths.dashboard.branch.userOverview ||
    path.startsWith(`${paths.dashboard.branch.userOverview}/`)
  );
}

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
  return [
    DASHBOARD_ROOT,
    paths.dashboard.branch.overview,
    paths.dashboard.branch.userOverview,
    paths.dashboard.branch.search,
    paths.dashboard.branch.create,
    editPath,
    `${DASHBOARD_ROOT}/branch`,
  ];
}

/**
 * Route guard redirects — nav uses strict slugs:
 * - branch overview → PermUIDashboardBranchView (`PERM.ui.dashboardBranchView`)
 * - user dashboard → PermUIDashboardBranchUserView (`PERM.ui.dashboardBranchUserView`)
 * `canViewBranchDashboard` / `canViewBranchUserDashboard` also allow scoped tenant fallbacks.
 */
export function getDashboardAccessRedirect(pathname, user) {
  const path = String(pathname ?? '');

  if (isBranchOverviewPath(path) && !canViewBranchDashboard(user)) {
    return canViewBranchUserDashboard(user)
      ? paths.dashboard.branch.userOverview
      : DASHBOARD_ROOT;
  }

  if (isBranchUserOverviewPath(path) && !canViewBranchUserDashboard(user)) {
    return canViewBranchDashboard(user) ? paths.dashboard.branch.overview : DASHBOARD_ROOT;
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

/**
 * Redirect target when dashboard API returns HTTP 403 (scope mismatch on backend).
 * Mirrors cross-dashboard fallback order used by `getDashboardAccessRedirect`.
 */
export function getDashboardApiForbiddenRedirect(pathname, user) {
  const path = String(pathname ?? '');

  if (isBranchOverviewPath(path)) {
    return canViewBranchUserDashboard(user)
      ? paths.dashboard.branch.userOverview
      : DASHBOARD_ROOT;
  }

  if (isBranchUserOverviewPath(path)) {
    return canViewBranchDashboard(user) ? paths.dashboard.branch.overview : DASHBOARD_ROOT;
  }

  return DASHBOARD_ROOT;
}

export function isCentralBranchTenantUser(user) {
  return userHasPermission(user, PERM.ui.companyTenantManage);
}

/** @deprecated */
export function isCompanyAdminUser(user) {
  return isCentralBranchTenantUser(user);
}
