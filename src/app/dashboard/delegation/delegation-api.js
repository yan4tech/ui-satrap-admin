import axios from 'src/lib/axios';
import { fetchRolesOptions } from 'src/app/dashboard/user/user-api';

const MODE_HEADERS = { mode: 'company' };
const LIST_PAGE_SIZE = 100;

function normalizeId(value) {
  return Number(value?.ID ?? value?.id ?? 0) || 0;
}

export async function fetchDelegations(filters = {}) {
  const params = new URLSearchParams();
  if (filters.actor_role_id) params.set('actor_role_id', String(filters.actor_role_id));
  if (filters.assignable_role_id) params.set('assignable_role_id', String(filters.assignable_role_id));
  if (filters.actor_slug) params.set('actor_slug', filters.actor_slug);
  if (filters.assignable_slug) params.set('assignable_slug', filters.assignable_slug);

  const qs = params.toString();
  const url = qs ? `/api/membership/ac/role-delegation?${qs}` : '/api/membership/ac/role-delegation';

  const res = await axios.get(url, {
    headers: {
      ...MODE_HEADERS,
      limit: String(LIST_PAGE_SIZE),
      offset: '0',
    },
  });

  const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
  return rows.map((item) => ({
    id: normalizeId(item),
    actor_role_id: Number(item?.actor_role_id ?? 0),
    assignable_role_id: Number(item?.assignable_role_id ?? 0),
    actor_role_title: item?.actor_role_title ?? '-',
    actor_role_slug: item?.actor_role_slug ?? '',
    assignable_role_title: item?.assignable_role_title ?? '-',
    assignable_role_slug: item?.assignable_role_slug ?? '',
  }));
}

export async function createDelegation(actorRoleId, assignableRoleId) {
  const res = await axios.post(
    '/api/membership/ac/role-delegation',
    {
      actor_role_id: Number(actorRoleId),
      assignable_role_id: Number(assignableRoleId),
    },
    { headers: MODE_HEADERS }
  );
  return res?.data?.data;
}

export async function deleteDelegation(id) {
  await axios.delete(`/api/membership/ac/role-delegation/${id}`, {
    headers: MODE_HEADERS,
  });
}

export { fetchRolesOptions };
