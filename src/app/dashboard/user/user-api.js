import axios from 'src/lib/axios';

const MODE_HEADERS = { mode: 'company' };
const LIST_PAGE_SIZE = 100;

/** برچسب حوزه کاربر از branch_id / company_id */
export function userScopeLabel(user) {
  const branchId = Number(user?.branch_id ?? 0);
  const companyId = Number(user?.company_id ?? 0);
  if (branchId > 0) return 'شعبه';
  if (companyId > 0) return 'شرکت';
  return 'عمومی';
}

function normalizeId(value) {
  return Number(value?.ID ?? value?.id ?? 0) || 0;
}

export async function fetchRolesOptions() {
  let offset = 0;
  let all = [];
  let hasMore = true;

  while (hasMore) {
    const res = await axios.get('/api/membership/ac/role', {
      headers: {
        ...MODE_HEADERS,
        limit: String(LIST_PAGE_SIZE),
        offset: String(offset),
      },
    });

    const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
    all = all.concat(rows);
    hasMore = rows.length === LIST_PAGE_SIZE;
    offset += LIST_PAGE_SIZE;
  }

  return all
    .map((item) => ({
      id: normalizeId(item),
      title: item?.title ?? '-',
      slug: item?.slug ?? '',
    }))
    .filter((item) => item.id > 0);
}

/**
 * Roles the logged-in user may assign (role delegation).
 * @param {{ context?: 'branch'|'company'|'', excludeBranchAdmin?: boolean }} [opts]
 */
export async function fetchAssignableRolesOptions(opts = {}) {
  const params = new URLSearchParams();
  if (opts.context) params.set('context', opts.context);
  if (opts.excludeBranchAdmin) params.set('exclude_branch_admin', 'true');

  const qs = params.toString();
  const url = qs
    ? `/api/membership/ac/role/assignable?${qs}`
    : '/api/membership/ac/role/assignable';

  const res = await axios.get(url, { headers: MODE_HEADERS });
  const rows = Array.isArray(res?.data?.data) ? res.data.data : [];

  return rows
    .map((item) => ({
      id: normalizeId(item),
      title: item?.title ?? '-',
      slug: item?.slug ?? '',
    }))
    .filter((item) => item.id > 0);
}

export const ROLE_SLUG_BRANCH_ADMIN = 'branch-admin';

export async function fetchRoleById(roleId) {
  const id = Number(roleId);
  if (!Number.isFinite(id) || id < 1) return null;

  const res = await axios.get(`/api/membership/ac/role/${id}`, {
    headers: MODE_HEADERS,
  });
  const item = res?.data?.data;
  if (!item) return null;

  return {
    id: normalizeId(item),
    title: item?.title ?? '-',
    slug: item?.slug ?? '-',
    description: item?.description ?? '',
    active: Boolean(item?.active),
  };
}

export async function fetchBranchesOptions() {
  let offset = 0;
  let all = [];
  let hasMore = true;

  while (hasMore) {
    const res = await axios.get('/api/membership/branch', {
      params: {
        limit: LIST_PAGE_SIZE,
        offset,
      },
      headers: MODE_HEADERS,
    });

    const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
    all = all.concat(rows);
    hasMore = rows.length === LIST_PAGE_SIZE;
    offset += LIST_PAGE_SIZE;
  }

  return all
    .map((item) => ({
      id: normalizeId(item),
      title: item?.title ?? '-',
    }))
    .filter((item) => item.id > 0);
}

export async function createUser(payload, documents = []) {
  const formData = new FormData();
  formData.append('payload', JSON.stringify(payload));

  documents.forEach((doc) => {
    formData.append('documents', doc.file);
    formData.append('document_tags', doc.title);
  });

  const res = await axios.post('/api/membership/admin/', formData, {
    headers: {
      ...MODE_HEADERS,
      'Content-Type': 'multipart/form-data',
    },
  });

  return res?.data;
}

export async function updateUser(userId, payload, documents = [], deleteDocumentIds = []) {
  const validDeleteDocumentIds = Array.from(
    new Set(
      (Array.isArray(deleteDocumentIds) ? deleteDocumentIds : [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    )
  );
  const formData = new FormData();
  formData.append(
    'payload',
    JSON.stringify({
      ...payload,
      delete_document_ids: validDeleteDocumentIds,
    })
  );

  documents.forEach((doc) => {
    formData.append('documents', doc.file);
    formData.append('document_tags', doc.title);
  });

  const res = await axios.put(`/api/membership/admin/${userId}`, formData, {
    headers: {
      ...MODE_HEADERS,
      'Content-Type': 'multipart/form-data',
    },
  });

  return res?.data;
}

export async function fetchUserById(userId) {
  const res = await axios.get(`/api/membership/admin/findById/${userId}`, {
    headers: MODE_HEADERS,
  });
  const payload = res?.data;
  if (!payload) return null;
  return payload?.data ?? payload;
}

export async function deleteUserById(userId) {
  await axios.delete(`/api/membership/admin/${userId}`, {
    headers: MODE_HEADERS,
  });
}

export async function searchUsers(filters, page, pageSize) {
  const params = new URLSearchParams();

  const branchIdRaw = filters.branch_id;
  const branchIdNum =
    branchIdRaw === '' || branchIdRaw == null ? NaN : Number(branchIdRaw);
  if (Number.isFinite(branchIdNum) && branchIdNum > 0) {
    params.set('branch_id', String(branchIdNum));
  }

  if (filters.name) params.set('name', filters.name);
  if (filters.family) params.set('family', filters.family);
  if (filters.mobile) params.set('mobile', filters.mobile);
  if (filters.email) params.set('email', filters.email);
  if (filters.role_id) params.set('role_id', String(filters.role_id));
  if (filters.active !== '') params.set('active', String(filters.active));
  if (filters.verified !== '') params.set('verified', String(filters.verified));

  const qs = params.toString();
  const url = qs ? `/api/membership/admin/users?${qs}` : '/api/membership/admin/users';

  const res = await axios.post(url, {}, {
    headers: {
      ...MODE_HEADERS,
      limit: String(pageSize),
      offset: String(page * pageSize),
    },
  });

  const payload = res?.data ?? {};
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return {
    data: rows,
    total: Number(payload?.total ?? payload?.count ?? rows.length),
  };
}
