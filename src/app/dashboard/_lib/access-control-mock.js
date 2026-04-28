/**
 * In-memory mock for roles / permissions / users (session lifetime).
 * Replace with API calls aligned with your Go models.
 */

const PERMISSION_TYPES = ['API', 'UI', 'SERVICE', 'PROCESS'];
const API_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

/** @typedef {{ id: number, title: string, slug: string, description: string, permission_type: string, active: boolean, api_path: string, api_method: string, process: number }} Permission */

/** @typedef {{ id: number, title: string, slug: string, description: string, active: boolean, content: string, permission_ids: number[] }} Role */

/** @typedef {{ id: number, name: string, family: string, email: string, mobile: string, role_id: number, branch_id: number, user_type: number, active: boolean, verified: boolean }} User */

/** @type {Permission[]} */
let permissions = [
  {
    id: 1,
    title: 'مشاهده داشبورد',
    slug: 'dashboard.view',
    description: 'دسترسی به صفحه اصلی داشبورد',
    permission_type: 'UI',
    active: true,
    api_path: '',
    api_method: '',
    process: 0,
  },
  {
    id: 2,
    title: 'مدیریت شعبه',
    slug: 'branch.manage',
    description: 'ایجاد و ویرایش شعبه',
    permission_type: 'API',
    active: true,
    api_path: '/api/branches',
    api_method: 'GET',
    process: 10,
  },
  {
    id: 3,
    title: 'گزارش مالی',
    slug: 'report.finance',
    description: 'خروجی گزارش',
    permission_type: 'PROCESS',
    active: false,
    api_path: '',
    api_method: '',
    process: 5,
  },
  {
    id: 4,
    title: 'سرویس نوتیفیکیشن',
    slug: 'svc.notify',
    description: 'ارسال اعلان',
    permission_type: 'SERVICE',
    active: true,
    api_path: '',
    api_method: '',
    process: 3,
  },
];

/** @type {Role[]} */
let roles = [
  {
    id: 1,
    title: 'مدیر هسته',
    slug: 'core-admin',
    description: 'دسترسی کامل هسته',
    active: true,
    content: '{}',
    permission_ids: [1, 2, 4],
  },
  {
    id: 2,
    title: 'کاربر شعبه',
    slug: 'branch-user',
    description: 'کاربر عادی شعبه',
    active: true,
    content: '{}',
    permission_ids: [1],
  },
];

/** @type {User[]} */
let users = [
  {
    id: 1,
    name: 'علی',
    family: 'احمدی',
    email: 'ali@example.com',
    mobile: '09120001111',
    role_id: 1,
    branch_id: 1,
    user_type: 0,
    active: true,
    verified: true,
  },
  {
    id: 2,
    name: 'مریم',
    family: 'کریمی',
    email: 'maryam@example.com',
    mobile: '09120002222',
    role_id: 2,
    branch_id: 2,
    user_type: 3,
    active: true,
    verified: false,
  },
];

let nextPermId = 100;
let nextRoleId = 100;
let nextUserId = 100;

const mockBranches = [
  { id: 1, title: 'شعبه مرکزی تهران' },
  { id: 2, title: 'شعبه اصفهان' },
  { id: 3, title: 'شعبه شیراز' },
];

export const USER_TYPE_OPTIONS = [
  { value: 0, label: 'مدیر هسته' },
  { value: 1, label: 'کاربر هسته' },
  { value: 2, label: 'مدیر شعبه' },
  { value: 3, label: 'کاربر شعبه' },
  { value: 4, label: 'ناظر' },
];

export { PERMISSION_TYPES, API_METHODS, mockBranches };

export function listPermissions() {
  return [...permissions];
}

export function getPermission(id) {
  return permissions.find((p) => p.id === Number(id)) ?? null;
}

export function createPermission(data) {
  const isApi = data.permission_type === 'API';
  const row = {
    id: nextPermId++,
    title: data.title,
    slug: data.slug,
    description: data.description ?? '',
    permission_type: data.permission_type,
    active: !!data.active,
    api_path: isApi ? (data.api_path ?? '') : '',
    api_method: isApi ? (data.api_method ?? '') : '',
    process: Number(data.process) || 0,
  };
  permissions = [...permissions, row];
  return row;
}

export function updatePermission(id, data) {
  const idx = permissions.findIndex((p) => p.id === Number(id));
  if (idx === -1) return null;
  const prev = permissions[idx];
  const nextPermissionType = data.permission_type ?? prev.permission_type;
  const isApi = nextPermissionType === 'API';
  const row = {
    ...prev,
    ...data,
    id: prev.id,
    api_path: isApi
      ? (data.api_path !== undefined ? data.api_path : prev.api_path)
      : '',
    api_method: isApi
      ? (data.api_method !== undefined ? data.api_method : prev.api_method)
      : '',
    process: data.process !== undefined ? Number(data.process) || 0 : prev.process,
  };
  permissions = permissions.map((p) => (p.id === row.id ? row : p));
  return row;
}

export function deletePermission(id) {
  const n = Number(id);
  permissions = permissions.filter((p) => p.id !== n);
  roles = roles.map((r) => ({
    ...r,
    permission_ids: r.permission_ids.filter((pid) => pid !== n),
  }));
}

export function listRoles() {
  return [...roles];
}

export function getRole(id) {
  return roles.find((r) => r.id === Number(id)) ?? null;
}

export function createRole(data) {
  const row = {
    id: nextRoleId++,
    title: data.title,
    slug: data.slug,
    description: data.description ?? '',
    active: !!data.active,
    content: data.content ?? '{}',
    permission_ids: Array.isArray(data.permission_ids) ? data.permission_ids.map(Number) : [],
  };
  roles = [...roles, row];
  return row;
}

export function updateRole(id, data) {
  const idx = roles.findIndex((r) => r.id === Number(id));
  if (idx === -1) return null;
  const prev = roles[idx];
  const row = {
    ...prev,
    ...data,
    id: prev.id,
    permission_ids:
      data.permission_ids !== undefined
        ? data.permission_ids.map(Number)
        : prev.permission_ids,
  };
  roles = roles.map((r) => (r.id === row.id ? row : r));
  return row;
}

export function deleteRole(id) {
  const n = Number(id);
  roles = roles.filter((r) => r.id !== n);
  users = users.map((u) => (u.role_id === n ? { ...u, role_id: 0 } : u));
}

export function listUsers() {
  return [...users];
}

export function getUser(id) {
  return users.find((u) => u.id === Number(id)) ?? null;
}

export function createUser(data) {
  const row = {
    id: nextUserId++,
    name: data.name,
    family: data.family,
    email: data.email ?? '',
    mobile: data.mobile,
    role_id: Number(data.role_id) || 0,
    branch_id: Number(data.branch_id) || 0,
    user_type: Number(data.user_type) ?? 3,
    active: !!data.active,
    verified: !!data.verified,
  };
  users = [...users, row];
  return row;
}

export function updateUser(id, data) {
  const idx = users.findIndex((u) => u.id === Number(id));
  if (idx === -1) return null;
  const prev = users[idx];
  const row = {
    ...prev,
    ...data,
    id: prev.id,
    role_id: data.role_id !== undefined ? Number(data.role_id) : prev.role_id,
    branch_id: data.branch_id !== undefined ? Number(data.branch_id) : prev.branch_id,
    user_type: data.user_type !== undefined ? Number(data.user_type) : prev.user_type,
  };
  users = users.map((u) => (u.id === row.id ? row : u));
  return row;
}

export function deleteUser(id) {
  users = users.filter((u) => u.id !== Number(id));
}

export function permissionTitlesByIds(ids) {
  const set = new Set(ids);
  return permissions.filter((p) => set.has(p.id)).map((p) => p.title);
}

export function roleTitleById(id) {
  const r = roles.find((x) => x.id === Number(id));
  return r?.title ?? '—';
}

export function branchTitleById(id) {
  const b = mockBranches.find((x) => x.id === Number(id));
  return b?.title ?? '—';
}

export function searchPermissions(filters, page, pageSize) {
  let rows = [...permissions];
  if (filters.title) {
    const q = filters.title.trim();
    rows = rows.filter((p) => p.title.includes(q));
  }
  if (filters.slug) {
    const q = filters.slug.trim();
    rows = rows.filter((p) => p.slug.includes(q));
  }
  if (filters.permission_type) {
    rows = rows.filter((p) => p.permission_type === filters.permission_type);
  }
  if (filters.api_method) {
    rows = rows.filter((p) => p.api_method === filters.api_method);
  }
  if (filters.active === 'true') rows = rows.filter((p) => p.active);
  if (filters.active === 'false') rows = rows.filter((p) => !p.active);
  const total = rows.length;
  const start = page * pageSize;
  return { data: rows.slice(start, start + pageSize), total };
}

export function searchRoles(filters, page, pageSize) {
  let rows = [...roles];
  if (filters.title) {
    const q = filters.title.trim();
    rows = rows.filter(
      (r) => r.title.includes(q) || r.slug.includes(q) || r.description.includes(q)
    );
  }
  if (filters.active === 'true') rows = rows.filter((r) => r.active);
  if (filters.active === 'false') rows = rows.filter((r) => !r.active);
  const total = rows.length;
  const start = page * pageSize;
  return { data: rows.slice(start, start + pageSize), total };
}

export function searchUsers(filters, page, pageSize) {
  let rows = [...users];
  if (filters.mobile) {
    const q = filters.mobile.trim();
    rows = rows.filter((u) => u.mobile.includes(q));
  }
  if (filters.name) {
    const q = filters.name.trim();
    rows = rows.filter(
      (u) => u.name.includes(q) || u.family.includes(q) || `${u.name} ${u.family}`.includes(q)
    );
  }
  if (filters.role_id !== undefined && filters.role_id !== '' && filters.role_id !== null) {
    const rid = Number(filters.role_id);
    if (Number.isFinite(rid)) {
      rows = rows.filter((u) => u.role_id === rid);
    }
  }
  if (filters.user_type !== undefined && filters.user_type !== '' && filters.user_type !== null) {
    const ut = Number(filters.user_type);
    if (Number.isFinite(ut)) {
      rows = rows.filter((u) => u.user_type === ut);
    }
  }
  if (filters.active === 'true') rows = rows.filter((u) => u.active);
  if (filters.active === 'false') rows = rows.filter((u) => !u.active);
  if (filters.verified === 'true') rows = rows.filter((u) => u.verified);
  if (filters.verified === 'false') rows = rows.filter((u) => !u.verified);
  const total = rows.length;
  const start = page * pageSize;
  return { data: rows.slice(start, start + pageSize), total };
}
