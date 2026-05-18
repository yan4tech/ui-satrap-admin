import axios from 'src/lib/axios';

const MODE_HEADERS = { mode: 'company' };

function normalizeId(value) {
  return Number(value?.ID ?? value?.id ?? 0) || 0;
}

export async function fetchProvinces() {
  const res = await axios.get('/api/membership/lookup/provinces', {
    headers: MODE_HEADERS,
  });
  const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
  return rows
    .map((item) => ({
      id: normalizeId(item),
      name: item?.name ?? '-',
    }))
    .filter((item) => item.id > 0);
}

export async function fetchRegistrationUnitsByProvince(provinceId) {
  const id = Number(provinceId);
  if (!Number.isFinite(id) || id < 1) return [];

  const res = await axios.get(`/api/membership/lookup/provinces/${id}/registration-units`, {
    headers: MODE_HEADERS,
  });
  const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
  return rows
    .map((item) => ({
      id: normalizeId(item),
      name: item?.name ?? '-',
      provinceId: Number(item?.province_id ?? id) || id,
    }))
    .filter((item) => item.id > 0);
}

/** id → name for units under the given province ids (e.g. branch search grid). */
export async function buildRegistrationUnitNameMap(provinceIds, seed = {}) {
  const map = { ...seed };
  const unique = [...new Set(provinceIds.map(Number).filter((id) => id > 0))];

  await Promise.all(
    unique.map(async (provinceId) => {
      const units = await fetchRegistrationUnitsByProvince(provinceId);
      units.forEach((unit) => {
        map[unit.id] = unit.name;
      });
    })
  );

  return map;
}
