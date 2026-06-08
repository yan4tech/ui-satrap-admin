/** هم‌راستا با gateway/middleware/require-admin.go */
export const CENTRAL_ADMIN_ROLE = 'central-admin';

/** @param {object|null|undefined} user */
export function isCentralAdmin(user) {
  return String(user?.role ?? user?.role_slug ?? '').trim() === CENTRAL_ADMIN_ROLE;
}
