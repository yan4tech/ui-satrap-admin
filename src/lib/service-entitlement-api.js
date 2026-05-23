import axios from 'src/lib/axios';
import { getApiRequestMode } from 'src/lib/api-mode';

const MODE_HEADER = () => ({ mode: getApiRequestMode() });

export function normalizeService(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = Number(raw.ID ?? raw.id);
  if (!Number.isFinite(id) || id < 1) return null;
  return {
    id,
    title: String(raw.title ?? raw.Title ?? '').trim() || `خدمت ${id}`,
    slug: String(raw.slug ?? raw.Slug ?? '').trim(),
    process_key: String(raw.process_key ?? raw.ProcessKey ?? raw.slug ?? '').trim(),
    description: String(raw.description ?? raw.Description ?? '').trim(),
    is_active: raw.is_active ?? raw.IsActive ?? true,
  };
}

export function normalizeServiceList(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.map(normalizeService).filter(Boolean);
}

export async function fetchMyBranchServices() {
  const res = await axios.get('/api/membership/user/my-services', {
    headers: MODE_HEADER(),
  });
  return normalizeServiceList(res?.data?.data ?? res?.data);
}

export async function fetchServiceCatalog() {
  const res = await axios.get('/api/membership/service', {
    headers: MODE_HEADER(),
    params: { limit: 100, is_active: true },
  });
  return normalizeServiceList(res?.data);
}

async function fetchBranchWithServices(branchId) {
  const res = await axios.get(`/api/membership/branch/${branchId}`, {
    headers: MODE_HEADER(),
  });
  const branch = res?.data ?? {};
  return normalizeServiceList(branch.services ?? branch.Services);
}

/** خدمات شعبه مرکزی */
export async function fetchCentralBranchServices(centralBranchId) {
  return fetchBranchWithServices(centralBranchId);
}

/** @deprecated alias */
export async function fetchCompanyServices(centralBranchId) {
  return fetchCentralBranchServices(centralBranchId);
}

/** خدمات زیرشعبه */
export async function fetchBranchServicesForCompany(centralBranchId, branchId) {
  return fetchBranchWithServices(branchId);
}

export async function assignCentralBranchServices(centralBranchId, serviceIds) {
  const res = await axios.put(
    `/api/membership/branch/${centralBranchId}`,
    { service_ids: serviceIds },
    { headers: MODE_HEADER() }
  );
  return res?.data;
}

/** @deprecated alias */
export async function assignCompanyServices(centralBranchId, serviceIds) {
  return assignCentralBranchServices(centralBranchId, serviceIds);
}

export async function assignBranchServices(centralBranchId, branchId, serviceIds) {
  const res = await axios.put(
    `/api/membership/branch/${branchId}`,
    { service_ids: serviceIds },
    { headers: MODE_HEADER() }
  );
  return normalizeServiceList(res?.data?.services ?? res?.data?.Services);
}

export const PROCESS_KEY_TO_SERVICE_PATH = {
  service1: '/dashboard/services/one',
  service2: '/dashboard/services/two',
  service3: '/dashboard/services/three',
};

export function servicePathForProcessKey(processKey) {
  const key = String(processKey ?? '').trim();
  return PROCESS_KEY_TO_SERVICE_PATH[key] ?? null;
}
