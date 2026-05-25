/**
 * Inbox queue modes — keep in sync with engine/models/work_inbox.model.go
 * همه صف‌ها شعبه‌محورند (شعبه مرکزی هم یک شعبه است).
 */
export const INBOX_MODE = {
  auto: 'auto',
  continue: 'continue',
  review: 'review',
};

export const INBOX_MODE_LABELS = {
  [INBOX_MODE.continue]: 'ادامه کار من',
  [INBOX_MODE.review]: 'صف بررسی',
};

/** @param {object|null|undefined} user */
export function resolveBranchIdFromUser(user) {
  const bid = user?.branch_id ?? user?.branchId ?? user?.BranchID;
  const n = Number(bid);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const REVIEWER_ROLES = new Set([
  'branch-admin',
  'company-reviewer',
  'company-admin',
  'central-reviewer',
  'central-admin',
]);

/**
 * Inbox tabs for the current user (UI hint; server enforces via actor + branch).
 * @param {object|null|undefined} user
 * @returns {string[]}
 */
export function resolveInboxModesForUser(user) {
  const branchId = resolveBranchIdFromUser(user);
  const role = String(user?.role ?? user?.role_slug ?? '').trim();
  const modes = [];

  const add = (m) => {
    if (!modes.includes(m)) modes.push(m);
  };

  if (branchId > 0) {
    add(INBOX_MODE.continue);
    if (REVIEWER_ROLES.has(role)) {
      add(INBOX_MODE.review);
    }
  } else if (REVIEWER_ROLES.has(role)) {
    // بدون شعبه در هدر — فقط صف بررسی (بازبینی سازمانی/سلسله‌مراتبی)
    add(INBOX_MODE.review);
  }

  if (modes.length === 0) {
    add(INBOX_MODE.continue);
  }
  return modes;
}

/**
 * Tabs shown in UI: intersection of role-based modes and server capabilities.
 * @param {string[]} availableFromApi
 * @param {object|null|undefined} user
 */
export function mergeInboxModes(availableFromApi, user) {
  const fromUser = resolveInboxModesForUser(user);
  const api = (availableFromApi || [])
    .map((m) => (String(m).trim() === 'central' ? INBOX_MODE.review : String(m).trim()))
    .filter(Boolean);
  if (!api.length) return fromUser;
  const intersected = fromUser.filter((m) => api.includes(m));
  return intersected.length ? intersected : fromUser;
}
