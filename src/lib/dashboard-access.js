import { paths } from 'src/routes/paths';

const DASHBOARD_ROOT = paths.dashboard.root;

/** مسیرهای مجاز برای مدیر شرکت (فقط اسکوپ شرکت خودش) */
const COMPANY_ADMIN_ALLOWED_PREFIXES = [
  DASHBOARD_ROOT,
  paths.dashboard.company.manage,
  `${DASHBOARD_ROOT}/branch`,
];

/**
 * @param {string} pathname
 * @param {string} userType
 * @returns {string|null} مسیر جایگزین در صورت عدم دسترسی
 */
export function getDashboardAccessRedirect(pathname, userType) {
  const type = String(userType ?? '').trim();
  const path = String(pathname ?? '');

  if (type === 'company_admin') {
    const allowed = COMPANY_ADMIN_ALLOWED_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`)
    );
    if (!allowed) {
      return paths.dashboard.company.manage;
    }
    return null;
  }

  if (type === 'company') {
    if (path.startsWith(paths.dashboard.company.manage)) {
      return DASHBOARD_ROOT;
    }
    return null;
  }

  return null;
}

export function isCentralOrgUser(userType) {
  return String(userType ?? '').trim() === 'company';
}

export function isCompanyAdminUser(userType) {
  return String(userType ?? '').trim() === 'company_admin';
}
