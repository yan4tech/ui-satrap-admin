import axios from 'src/lib/axios';

const MODE_HEADERS = { mode: 'company' };
const LIST_PAGE_SIZE = 100;

export const USER_TYPE_OPTIONS = [
  { value: 'mobile', label: 'موبایل' },
  { value: 'branch', label: 'شعبه' },
  { value: 'company', label: 'شرکت' },
];

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
    }))
    .filter((item) => item.id > 0);
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
  const branchId = filters.branch_id === '' ? '0' : String(filters.branch_id ?? 0);
  const userType = filters.user_type || 'mobile';
  params.set('branch_id', branchId);
  params.set('user_type', userType);

  if (filters.name) params.set('name', filters.name);
  if (filters.family) params.set('family', filters.family);
  if (filters.mobile) params.set('mobile', filters.mobile);
  if (filters.email) params.set('email', filters.email);
  if (filters.role_id) params.set('role_id', String(filters.role_id));
  if (filters.active !== '') params.set('active', String(filters.active));
  if (filters.verified !== '') params.set('verified', String(filters.verified));

  const res = await axios.post(`/api/membership/admin/users?${params.toString()}`, {}, {
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
