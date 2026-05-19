import { normalizeServiceList } from 'src/lib/service-entitlement-api';

export function servicesFromCompany(companyData) {
  const raw = companyData?.services ?? companyData?.Services;
  return normalizeServiceList(Array.isArray(raw) ? raw : []);
}

export function branchesFromCompany(companyData) {
  const raw = companyData?.branches ?? companyData?.Branches;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b) => ({
      id: Number(b?.ID ?? b?.id ?? 0) || 0,
      title: String(b?.title ?? b?.Title ?? '').trim() || 'شعبه',
      review_required: b?.review_required !== false && b?.ReviewRequired !== false,
    }))
    .filter((b) => b.id > 0);
}

export function idsFromSelection(items) {
  return (items ?? []).map((item) => item.id).filter((id) => id > 0);
}

export { branchAssignmentsFromSelection } from 'src/lib/branch-workflow';
