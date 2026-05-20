/**
 * Permission slugs — keep in sync with membership/models/permission_slugs.go
 */
export const PERM = {
  ui: {
    dashboardView: 'ui.dashboard.view',
    dashboardCompanyView: 'ui.dashboard.company.view',
    dashboardBranchView: 'ui.dashboard.branch.view',
    usersList: 'ui.users.list',
    usersCreate: 'ui.users.create',
    rolesList: 'ui.roles.list',
    rolesCreate: 'ui.roles.create',
    roleDelegationManage: 'ui.role.delegation.manage',
    permissionsList: 'ui.permissions.list',
    permissionsCreate: 'ui.permissions.create',
    accessControlManage: 'ui.access-control.manage',
    companyTenantManage: 'ui.company.tenant.manage',
    companyCentralList: 'ui.company.central.list',
    companyCentralCreate: 'ui.company.central.create',
    companyCentral: 'ui.company.central',
    companyTenant: 'ui.company.tenant',
    branchTenantList: 'ui.branch.tenant.list',
    branchTenantCreate: 'ui.branch.tenant.create',
    branchTenant: 'ui.branch.tenant',
    branchCentralList: 'ui.branch.central.list',
    branchCentralCreate: 'ui.branch.central.create',
    branchCentral: 'ui.branch.central',
    servicesList: 'ui.services.list',
    servicesOne: 'ui.services.one',
    servicesTwo: 'ui.services.two',
    servicesThree: 'ui.services.three',
    servicesManage: 'ui.services.manage',
    usersManage: 'ui.users.manage',
  },
};

/** @param {object|null|undefined} user */
export function getUserPermissionSlugs(user) {
  if (!user) return [];
  if (Array.isArray(user.permissions) && user.permissions.length) {
    return user.permissions.map((p) => String(p).trim()).filter(Boolean);
  }
  if (Array.isArray(user.permission_slugs) && user.permission_slugs.length) {
    return user.permission_slugs.map((p) => String(p).trim()).filter(Boolean);
  }
  const fromRole = user.role?.permissions;
  if (Array.isArray(fromRole)) {
    return fromRole
      .map((p) => (typeof p === 'string' ? p : p?.slug))
      .filter(Boolean)
      .map((s) => String(s).trim());
  }
  return [];
}

/** @param {object|null|undefined} user @param {string} slug */
export function userHasPermission(user, slug) {
  if (!slug) return false;
  return getUserPermissionSlugs(user).includes(slug);
}

/** @param {object|null|undefined} user @param {string[]} slugs */
export function userHasAnyPermission(user, slugs) {
  if (!slugs?.length) return false;
  const set = new Set(getUserPermissionSlugs(user));
  return slugs.some((s) => set.has(s));
}

/** @param {object|null|undefined} user @param {string[]} slugs */
export function userHasAllPermissions(user, slugs) {
  if (!slugs?.length) return false;
  const set = new Set(getUserPermissionSlugs(user));
  return slugs.every((s) => set.has(s));
}
