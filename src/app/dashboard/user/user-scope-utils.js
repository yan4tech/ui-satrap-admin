/** @param {{ branchId?: number }} opts */
export function resolveAssignableRoleContext({ branchId }) {
  const bid = Number(branchId ?? 0);
  if (bid > 0) {
    return { context: 'branch', excludeBranchAdmin: true };
  }
  return { context: '', excludeBranchAdmin: false };
}

/** @param {number} branchId */
export function branchIdForPayload(branchId) {
  const bid = Number(branchId ?? 0);
  return bid > 0 ? bid : null;
}
