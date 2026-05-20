/** @param {object} branch */
export function branchCompanyId(branch) {
  return Number(branch?.company_id ?? branch?.CompanyID ?? 0) || 0;
}

/**
 * @param {Array<{ id: number, company_id?: number }>} branches
 * @param {number} companyId
 */
export function filterBranchesForCompany(branches, companyId) {
  const cid = Number(companyId ?? 0);
  if (cid <= 0) return branches;
  return branches.filter((b) => branchCompanyId(b) === cid);
}

/** @param {{ branchId?: number, companyId?: number }} opts */
export function resolveAssignableRoleContext({ branchId, companyId }) {
  const bid = Number(branchId ?? 0);
  const cid = Number(companyId ?? 0);
  if (bid > 0) {
    return { context: 'branch', excludeBranchAdmin: true };
  }
  if (cid > 0) {
    return { context: 'company', excludeBranchAdmin: false };
  }
  return { context: '', excludeBranchAdmin: false };
}

/** @param {number} companyId */
export function companyIdForPayload(companyId) {
  const cid = Number(companyId ?? 0);
  return cid > 0 ? cid : null;
}
