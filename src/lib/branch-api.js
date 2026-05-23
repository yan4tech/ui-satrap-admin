import axios from 'src/lib/axios';

import { updateUser } from 'src/app/dashboard/user/user-api';

const LIST_PAGE_SIZE = 200;

function normalizeBranchId(value) {
  return Number(value?.ID ?? value?.id ?? 0) || 0;
}

export function normalizeBranchOption(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = normalizeBranchId(raw);
  if (id < 1) return null;
  return {
    id,
    title: String(raw.title ?? raw.Title ?? '').trim() || `شعبه ${id}`,
    is_central: Boolean(raw.is_central ?? raw.IsCentral),
    parent_branch_id: raw.parent_branch_id ?? raw.ParentBranchID ?? null,
    max_sub_branches: Number(raw.max_sub_branches ?? raw.MaxSubBranches ?? 0) || 0,
  };
}

/** شعب قابل تخصیص به شعبه مرکزی (آزاد یا زیرمجموعه همین شعبه؛ بدون ایجاد حلقه در درخت) */
export async function fetchAssignableBranches({ parentBranchId, excludeBranchId } = {}) {
  const params = {
    limit: LIST_PAGE_SIZE,
    offset: 0,
    is_active: true,
  };
  const parentId = Number(parentBranchId);
  const excludeId = Number(excludeBranchId);
  if (parentId > 0) {
    params.assignable_to_parent = parentId;
    params.exclude_branch_id = parentId;
  } else {
    params.unassigned_only = true;
  }
  if (excludeId > 0) {
    params.exclude_branch_id = excludeId;
  }

  const res = await axios.get('/api/membership/branch', { params });
  const payload = res?.data ?? {};
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map(normalizeBranchOption).filter(Boolean);
}

/** شعب مرکزی برای انتخاب والد (بدون خود شعبه و زیرمجموعه‌هایش) */
export async function fetchCentralBranchOptions({ excludeBranchId } = {}) {
  const params = {
    limit: LIST_PAGE_SIZE,
    offset: 0,
    is_active: true,
  };
  const excludeId = Number(excludeBranchId);
  if (excludeId > 0) {
    params.assignable_as_parent_for = excludeId;
  } else {
    params.is_central = true;
    params.unassigned_only = true;
  }

  const res = await axios.get('/api/membership/branch', { params });
  const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
  return rows.map(normalizeBranchOption).filter(Boolean);
}

export async function fetchMyCentralBranch() {
  const res = await axios.get('/api/membership/branch/me');
  return res?.data ?? null;
}

export async function fetchBranchWorkflowConfig(branchId) {
  const res = await axios.get(`/api/membership/branch/${branchId}/workflow-config`);
  return res?.data ?? null;
}

const TREE_LIST_LIMIT = 500;

export async function fetchBranchesForTree() {
  const res = await axios.get('/api/membership/branch', {
    params: { limit: TREE_LIST_LIMIT, offset: 0, tree_view: true },
  });
  const payload = res?.data ?? {};
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows;
}

export async function moveUserToBranch(userId, branchId) {
  const uid = Number(userId);
  const bid = Number(branchId);
  if (!Number.isFinite(uid) || uid < 1) {
    throw new Error('شناسه کاربر معتبر نیست');
  }
  if (!Number.isFinite(bid) || bid < 1) {
    throw new Error('شناسه شعبه معتبر نیست');
  }
  return updateUser(uid, { branch_id: bid });
}

export async function assignBranchParent(branchId, parentBranchId) {
  const id = Number(branchId);
  if (!Number.isFinite(id) || id < 1) {
    throw new Error('شناسه شعبه معتبر نیست');
  }
  const parentId = Number(parentBranchId);
  const body = {
    parent_branch_id: parentId > 0 ? parentId : null,
  };
  const res = await axios.put(`/api/membership/branch/${id}/parent`, body);
  return res?.data;
}

export async function deleteBranch(branchId) {
  const id = Number(branchId);
  if (!Number.isFinite(id) || id < 1) {
    throw new Error('شناسه شعبه معتبر نیست');
  }
  const res = await axios.delete(`/api/membership/branch/${id}`);
  return res?.data;
}

export async function setBranchReviewRequired(branchId, reviewRequired) {
  const res = await axios.put(
    `/api/membership/branch/${branchId}/review-required`,
    { review_required: Boolean(reviewRequired) }
  );
  return res?.data;
}
