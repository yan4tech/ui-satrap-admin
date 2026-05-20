import axios from 'src/lib/axios';
import { setBranchIdForApi } from 'src/lib/api-branch-header';

export const BRANCH_ADMIN_ROLE_SLUG = 'branch-admin';

function normalizeId(value) {
  return Number(value?.ID ?? value?.id ?? 0) || 0;
}

/** هدرهای درخواست بر اساس scope کاربر جاری */
export function membershipHeadersForUser(user) {
  const branchId = Number(user?.branch_id ?? 0);
  if (branchId > 0) {
    setBranchIdForApi(branchId);
    return { mode: 'branch' };
  }
  return { mode: 'company' };
}

export async function fetchBranchUsers(branchId, user) {
  const res = await axios.get(`/api/membership/branch/${branchId}/users`, {
    headers: membershipHeadersForUser(user),
  });
  return Array.isArray(res?.data) ? res.data : [];
}

export async function createBranchUser(branchId, payload, user) {
  const res = await axios.post(`/api/membership/branch/${branchId}/users`, payload, {
    headers: membershipHeadersForUser(user),
  });
  return res?.data;
}

export async function updateBranchUser(branchId, userId, payload, actor) {
  const res = await axios.put(`/api/membership/branch/${branchId}/users/${userId}`, payload, {
    headers: membershipHeadersForUser(actor),
  });
  return res?.data;
}

export async function deleteBranchUser(branchId, userId, actor) {
  await axios.delete(`/api/membership/branch/${branchId}/users/${userId}`, {
    headers: membershipHeadersForUser(actor),
  });
}

export async function assignBranchAdmin(branchId, userId, actor) {
  const res = await axios.put(
    `/api/membership/branch/${branchId}/users/${userId}/branch-admin`,
    {},
    { headers: membershipHeadersForUser(actor) }
  );
  return res?.data;
}

export function isBranchAdminUser(row) {
  const slug = String(row?.role?.slug ?? row?.Role?.Slug ?? '').trim();
  return slug === BRANCH_ADMIN_ROLE_SLUG;
}

export function countActiveBranchUsers(rows) {
  return (rows || []).filter((u) => u?.active === true || u?.Active === true).length;
}

export { normalizeId };
