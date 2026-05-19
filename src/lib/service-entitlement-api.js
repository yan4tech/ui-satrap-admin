import axios from 'src/lib/axios';
import { getApiRequestMode } from 'src/lib/api-mode';

const MODE_HEADER = () => ({ mode: getApiRequestMode() });

/** @typedef {{ id: number, title: string, slug?: string, process_key: string, description?: string, is_active?: boolean }} CatalogService */

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

/** خدمات مجاز کاربر شعبه (یا تقاطع با نقش) */
export async function fetchMyBranchServices() {
  const res = await axios.get('/api/membership/user/my-services', {
    headers: MODE_HEADER(),
  });
  return normalizeServiceList(res?.data?.data ?? res?.data);
}

/** کاتالوگ جهانی — ادمین مرکزی */
export async function fetchServiceCatalog() {
  const res = await axios.get('/api/membership/service', {
    headers: { mode: 'company' },
    params: { limit: 100, is_active: true },
  });
  return normalizeServiceList(res?.data);
}

/** خدمات مجاز یک شرکت */
export async function fetchCompanyServices(companyId) {
  const res = await axios.get(`/api/membership/company/${companyId}/services`, {
    headers: { mode: 'company' },
  });
  return normalizeServiceList(res?.data);
}

/** خدمات تخصیص‌یافته به شعبه (مدیر شرکت) */
export async function fetchBranchServicesForCompany(companyId, branchId) {
  const res = await axios.get(
    `/api/membership/company/${companyId}/branches/${branchId}/services`,
    { headers: { mode: 'company' } }
  );
  return normalizeServiceList(res?.data);
}

export async function assignCompanyServices(companyId, serviceIds) {
  const res = await axios.put(
    `/api/membership/company/${companyId}/services`,
    { service_ids: serviceIds },
    { headers: { mode: 'company' } }
  );
  return res?.data;
}

export async function assignBranchServices(companyId, branchId, serviceIds) {
  const res = await axios.put(
    `/api/membership/company/${companyId}/branches/${branchId}/services`,
    { service_ids: serviceIds },
    { headers: { mode: 'company' } }
  );
  return normalizeServiceList(res?.data?.services ?? res?.data);
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
