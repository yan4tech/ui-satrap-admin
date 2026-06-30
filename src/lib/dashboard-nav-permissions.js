import { PERM, userHasPermission, userHasAnyPermission } from 'src/lib/permissions';

/** دسترسی‌هایی که آیتم «داشبورد شرکت» را در منو فعال می‌کنند */
export const COMPANY_DASHBOARD_NAV_PERMISSIONS = [
  PERM.ui.dashboardCompanyView,
  PERM.ui.companyTenantManage,
  PERM.ui.companyTenant,
];

/** فقط دسترسی اختصاصی داشبورد شعبه — لیست/مدیریت شعب جداست */
export const BRANCH_DASHBOARD_NAV_PERMISSIONS = [PERM.ui.dashboardBranchView];

/** داشبورد شخصی کاربر شعبه */
export const BRANCH_USER_DASHBOARD_NAV_PERMISSIONS = [PERM.ui.dashboardBranchUserView];

export function canViewCompanyDashboard(user) {
  return userHasAnyPermission(user, COMPANY_DASHBOARD_NAV_PERMISSIONS);
}

export function canViewCentralDashboard(user) {
  return userHasPermission(user, PERM.ui.dashboardView);
}

export function canViewBranchDashboard(user) {
  if (userHasPermission(user, PERM.ui.dashboardBranchView)) {
    return true;
  }
  // مدیر شعبه (اسکوپ مستأجر): بدون نیاز به دسترسی جداگانه داشبورد
  const branchId = Number(user?.branch_id ?? user?.BranchID ?? 0);
  if (branchId > 0) {
    return userHasAnyPermission(user, [PERM.ui.branchTenantList, PERM.ui.branchTenant]);
  }
  return false;
}

export function canViewBranchUserDashboard(user) {
  if (userHasPermission(user, PERM.ui.dashboardBranchUserView)) {
    return true;
  }
  const branchId = Number(user?.branch_id ?? user?.BranchID ?? 0);
  return branchId > 0 && !canViewBranchDashboard(user);
}
