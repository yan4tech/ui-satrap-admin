import axios from 'src/lib/axios';

const MODE_HEADERS = { mode: 'company' };
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
    company_id: raw.company_id ?? raw.CompanyID ?? null,
  };
}

/**
 * شعب قابل تخصیص به شرکت:
 * - ایجاد: فقط بدون شرکت (company_id خالی)
 * - ویرایش: بدون شرکت یا متعلق به همین شرکت (نه شرکت دیگر، نه مستقلِ متعلق به شرکت دیگر)
 */
export async function fetchAssignableBranches({ companyId } = {}) {
  const params = {
    limit: LIST_PAGE_SIZE,
    offset: 0,
    is_active: true,
  };
  if (companyId && Number(companyId) > 0) {
    params.assignable_to_company = Number(companyId);
  } else {
    params.unassigned_only = true;
  }

  const res = await axios.get('/api/membership/branch', {
    params,
    headers: MODE_HEADERS,
  });
  const payload = res?.data ?? {};
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map(normalizeBranchOption).filter(Boolean);
}

export async function fetchBranchWorkflowConfig(branchId) {
  const res = await axios.get(`/api/membership/branch/${branchId}/workflow-config`, {
    headers: MODE_HEADERS,
  });
  return res?.data ?? null;
}

export async function setBranchReviewRequired(branchId, reviewRequired) {
  const res = await axios.put(
    `/api/membership/branch/${branchId}/review-required`,
    { review_required: Boolean(reviewRequired) },
    { headers: MODE_HEADERS }
  );
  return res?.data;
}
