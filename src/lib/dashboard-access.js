import { paths } from 'src/routes/paths';

import { PERM, userHasAnyPermission, userHasPermission } from 'src/lib/permissions';

const DASHBOARD_ROOT = paths.dashboard.root;

/** مسیرهای مجاز برای مدیر شرکت (اسکوپ مستأجر) */
const COMPANY_TENANT_ALLOWED_PREFIXES = [
  DASHBOARD_ROOT,
  paths.dashboard.company.manage,
  `${DASHBOARD_ROOT}/branch`,
];

/**
 * @param {string} pathname
 * @param {object|null|undefined} user
 * @returns {string|null} مسیر جایگزین در صورت عدم دسترسی
 */
export function getDashboardAccessRedirect(pathname, user) {
  const path = String(pathname ?? '');

  const isTenantOnly =
    userHasPermission(user, PERM.ui.companyTenantManage) &&
    !userHasAnyPermission(user, [PERM.ui.companyCentralList, PERM.ui.companyCentralCreate]);

  if (isTenantOnly) {
    const allowed = COMPANY_TENANT_ALLOWED_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`)
    );
    if (!allowed) {
      return paths.dashboard.company.manage;
    }
    return null;
  }

  const isCentralOnly =
    userHasAnyPermission(user, [PERM.ui.companyCentralList, PERM.ui.companyCentralCreate]) &&
    !userHasPermission(user, PERM.ui.companyTenantManage);

  if (isCentralOnly) {
    if (path.startsWith(paths.dashboard.company.manage)) {
      return DASHBOARD_ROOT;
    }
    return null;
  }

  return null;
}

export function isCentralOrgUser(user) {
  return userHasAnyPermission(user, [PERM.ui.companyCentralList, PERM.ui.companyCentralCreate]);
}

export function isCompanyAdminUser(user) {
  return userHasPermission(user, PERM.ui.companyTenantManage);
}
