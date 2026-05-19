import axios from 'src/lib/axios';

const MODE_HEADERS = { mode: 'company' };
const LIST_PAGE_SIZE = 100;

function normalizeId(value) {
  return Number(value?.ID ?? value?.id ?? 0) || 0;
}

export async function fetchCompanies(params = {}) {
  const res = await axios.get('/api/membership/company', {
    params: {
      limit: params.limit ?? LIST_PAGE_SIZE,
      offset: params.offset ?? 0,
      ...params,
    },
    headers: MODE_HEADERS,
  });
  const rows = Array.isArray(res?.data) ? res.data : [];
  return rows;
}

export async function fetchCompanyById(companyId) {
  const res = await axios.get(`/api/membership/company/${companyId}`, {
    headers: MODE_HEADERS,
  });
  return res?.data ?? null;
}

export async function fetchMyCompany() {
  const res = await axios.get('/api/membership/company/me', {
    headers: MODE_HEADERS,
  });
  return res?.data ?? null;
}

export async function updateMyCompany(payload) {
  const res = await axios.put('/api/membership/company/me', payload, {
    headers: MODE_HEADERS,
  });
  return res?.data;
}

export async function createCompany(payload) {
  const res = await axios.post('/api/membership/company', payload, {
    headers: MODE_HEADERS,
  });
  return res?.data;
}

export async function updateCompany(companyId, payload) {
  const res = await axios.put(`/api/membership/company/${companyId}`, payload, {
    headers: MODE_HEADERS,
  });
  return res?.data;
}

export async function deleteCompany(companyId) {
  await axios.delete(`/api/membership/company/${companyId}`, {
    headers: MODE_HEADERS,
  });
}

export async function fetchCompaniesOptions() {
  const rows = await fetchCompanies({ limit: LIST_PAGE_SIZE, offset: 0 });
  return rows
    .map((item) => ({
      id: normalizeId(item),
      title: item?.title ?? '-',
      max_branches: Number(item?.max_branches ?? 0),
      branchCount: Array.isArray(item?.branches) ? item.branches.length : 0,
    }))
    .filter((item) => item.id > 0);
}

export { normalizeId as normalizeCompanyId };
