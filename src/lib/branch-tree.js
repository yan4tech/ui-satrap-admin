export function branchNodeId(raw) {
  return Number(raw?.ID ?? raw?.id ?? 0) || 0;
}

export function branchParentId(raw) {
  const pid = raw?.parent_branch_id ?? raw?.ParentBranchID ?? null;
  const n = Number(pid);
  return n > 0 ? n : 0;
}

export function normalizeBranchTreeNode(raw) {
  const id = branchNodeId(raw);
  if (id < 1) return null;
  return {
    id,
    title: String(raw?.title ?? raw?.Title ?? '').trim() || `شعبه ${id}`,
    is_central: Boolean(raw?.is_central ?? raw?.IsCentral),
    is_active: Boolean(raw?.is_active ?? raw?.IsActive ?? true),
    parent_branch_id: branchParentId(raw),
    max_users: Number(raw?.max_users ?? raw?.MaxUsers ?? 0) || 0,
  };
}

export function normalizeTreeUser(raw) {
  const id = Number(raw?.ID ?? raw?.id ?? 0) || 0;
  if (id < 1) return null;
  return {
    id,
    name: String(raw?.name ?? '').trim(),
    family: String(raw?.family ?? '').trim(),
    mobile: String(raw?.mobile ?? '').trim(),
    active: Boolean(raw?.active ?? raw?.Active),
    verified: Boolean(raw?.verified ?? raw?.Verified),
    branch_id: Number(raw?.branch_id ?? raw?.BranchID ?? 0) || 0,
    role_title: String(raw?.role?.title ?? raw?.Role?.Title ?? '').trim(),
    role_slug: String(raw?.role?.slug ?? raw?.Role?.Slug ?? '').trim(),
  };
}

export function usersByBranchFromRawRows(rows) {
  const map = new Map();
  (rows || []).forEach((raw) => {
    const branchId = branchNodeId(raw);
    if (branchId < 1) return;
    const users = Array.isArray(raw?.users) ? raw.users : [];
    const list = users.map(normalizeTreeUser).filter(Boolean);
    sortUsersList(list);
    map.set(branchId, list);
  });
  return map;
}

function sortUsersList(list) {
  list.sort((a, b) => {
    const la = `${a.family} ${a.name}`.trim();
    const lb = `${b.family} ${b.name}`.trim();
    return la.localeCompare(lb, 'fa');
  });
}

export function cloneUsersByBranchMap(map) {
  const next = new Map();
  map.forEach((users, branchId) => {
    next.set(branchId, users.map((u) => ({ ...u })));
  });
  return next;
}

export function userBranchMapFromUsersByBranch(usersByBranchId) {
  const map = new Map();
  usersByBranchId.forEach((users, branchId) => {
    users.forEach((u) => map.set(u.id, branchId));
  });
  return map;
}

export function collectUserBranchChanges(initialUsersByBranch, currentUsersByBranch) {
  const initial = userBranchMapFromUsersByBranch(initialUsersByBranch);
  const current = userBranchMapFromUsersByBranch(currentUsersByBranch);
  const changes = [];
  current.forEach((branchId, userId) => {
    const prev = initial.get(userId);
    if (prev !== branchId) {
      changes.push({ userId, branchId });
    }
  });
  return changes;
}

export function validateUserMove({ userId, targetBranchId, usersByBranchId, nodesById }) {
  if (!userId) {
    return 'کاربر نامعتبر است';
  }
  if (!targetBranchId) {
    return 'کاربر باید به یک شعبه منتقل شود';
  }
  const targetNode = nodesById.get(targetBranchId);
  if (!targetNode) {
    return 'شعبه مقصد یافت نشد';
  }
  if (!targetNode.is_active) {
    return 'شعبه مقصد باید فعال باشد';
  }

  let user = null;
  let sourceBranchId = 0;
  usersByBranchId.forEach((users, branchId) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      user = found;
      sourceBranchId = branchId;
    }
  });
  if (!user) {
    return 'کاربر یافت نشد';
  }
  if (sourceBranchId === targetBranchId) {
    return null;
  }

  const maxUsers = targetNode.max_users || 0;
  if (maxUsers > 0 && user.active) {
    const targetUsers = usersByBranchId.get(targetBranchId) || [];
    const activeCount = targetUsers.filter((u) => u.active && u.id !== userId).length;
    if (activeCount >= maxUsers) {
      return 'سقف کاربران شعبه مقصد پر است';
    }
  }
  return null;
}

export function applyUserMoveInMap(usersByBranchId, userId, targetBranchId) {
  const next = cloneUsersByBranchMap(usersByBranchId);
  let movedUser = null;

  next.forEach((users) => {
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      movedUser = { ...users[idx], branch_id: targetBranchId };
      users.splice(idx, 1);
    }
  });

  if (!movedUser) {
    return usersByBranchId;
  }

  if (!next.has(targetBranchId)) {
    next.set(targetBranchId, []);
  }
  next.get(targetBranchId).push(movedUser);
  sortUsersList(next.get(targetBranchId));
  return next;
}

export const TREE_DRAG_MIME = 'application/x-branch-tree-drag';

export function encodeTreeDragPayload(type, id) {
  return JSON.stringify({ type, id });
}

export function decodeTreeDragPayload(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const type = parsed?.type;
    const id = Number(parsed?.id);
    if ((type === 'branch' || type === 'user') && id > 0) {
      return { type, id };
    }
  } catch {
    // legacy branch-only drag
  }
  const legacyId = Number(raw);
  if (legacyId > 0) {
    return { type: 'branch', id: legacyId };
  }
  return null;
}

export function parentMapFromNodes(nodes) {
  const map = new Map();
  nodes.forEach((node) => {
    map.set(node.id, node.parent_branch_id || 0);
  });
  return map;
}

export function cloneParentMap(map) {
  return new Map(map);
}

export function buildBranchForest(nodes, parentById) {
  const byId = new Map();
  nodes.forEach((node) => {
    byId.set(node.id, {
      ...node,
      parent_branch_id: parentById.get(node.id) || 0,
      children: [],
    });
  });

  const attached = new Set();

  byId.forEach((node) => {
    const pid = node.parent_branch_id || 0;
    if (pid > 0 && pid !== node.id && byId.has(pid)) {
      const descendants = descendantIds(parentById, node.id);
      if (!descendants.includes(pid)) {
        byId.get(pid).children.push(node);
        attached.add(node.id);
      }
    }
  });

  const roots = [];
  byId.forEach((node) => {
    if (!attached.has(node.id)) {
      roots.push(node);
    }
  });

  const sortRecursive = (list) => {
    list.sort((a, b) => a.title.localeCompare(b.title, 'fa'));
    list.forEach((item) => sortRecursive(item.children));
  };
  sortRecursive(roots);
  return roots;
}

export function descendantIds(parentById, branchId) {
  const children = new Map();
  parentById.forEach((pid, id) => {
    if (pid > 0) {
      if (!children.has(pid)) children.set(pid, []);
      children.get(pid).push(id);
    }
  });

  const out = [];
  const stack = [...(children.get(branchId) || [])];
  while (stack.length) {
    const cur = stack.pop();
    out.push(cur);
    const kids = children.get(cur);
    if (kids?.length) stack.push(...kids);
  }
  return out;
}

export function validateBranchMove({ branchId, newParentId, nodesById, parentById }) {
  if (!branchId) {
    return 'شعبه نامعتبر است';
  }
  if (branchId === newParentId) {
    return 'شعبه نمی‌تواند والد خودش باشد';
  }
  if (newParentId > 0) {
    const parentNode = nodesById.get(newParentId);
    if (!parentNode) {
      return 'شعبه والد یافت نشد';
    }
    if (!parentNode.is_central) {
      return 'فقط شعبه مرکزی می‌تواند والد باشد';
    }
    if (!parentNode.is_active) {
      return 'شعبه والد باید فعال باشد';
    }
    const desc = descendantIds(parentById, branchId);
    if (desc.includes(newParentId)) {
      return 'این جابجایی باعث حلقه در درخت می‌شود';
    }
  }
  return null;
}

export function collectParentChanges(initialMap, currentMap) {
  const changes = [];
  currentMap.forEach((parentId, branchId) => {
    const initial = initialMap.get(branchId) || 0;
    const next = parentId || 0;
    if (initial !== next) {
      changes.push({ branchId, parentId: next });
    }
  });
  return changes;
}

export function orderParentChanges(changes, parentById) {
  const toRoot = changes.filter((c) => !c.parentId);
  const rest = changes.filter((c) => c.parentId);

  const depthOf = (id) => {
    let depth = 0;
    let cur = parentById.get(id) || 0;
    const seen = new Set();
    while (cur > 0 && !seen.has(cur)) {
      seen.add(cur);
      depth += 1;
      cur = parentById.get(cur) || 0;
    }
    return depth;
  };

  rest.sort((a, b) => depthOf(a.parentId) - depthOf(b.parentId));
  return [...toRoot, ...rest];
}
