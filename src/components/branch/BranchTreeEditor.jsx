'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Chip,
  Stack,
  Alert,
  Collapse,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Icon } from '@iconify/react';

import { paths } from 'src/routes/paths';
import {
  buildBranchForest,
  validateBranchMove,
  validateUserMove,
  cloneParentMap,
  applyUserMoveInMap,
  encodeTreeDragPayload,
  decodeTreeDragPayload,
  TREE_DRAG_MIME,
} from 'src/lib/branch-tree';

const ROOT_DROP_ID = 'root';
const USER_LIST_MAX_HEIGHT = 220;
const USER_LIST_SCROLL_THRESHOLD = 6;

const DEPTH_STYLES = [
  { accent: 'info.main', icon: 'info.main' },
  { accent: 'primary.main', icon: 'primary.main' },
  { accent: 'secondary.main', icon: 'secondary.main' },
  { accent: 'warning.main', icon: 'warning.dark' },
];

function branchDepthStyle(depth, isCentral) {
  const level = DEPTH_STYLES[Math.min(depth, DEPTH_STYLES.length - 1)];
  if (isCentral) {
    return { accent: 'info.main', icon: 'info.dark' };
  }
  return level;
}

function depthBg(theme, accentKey, amount = 0.09) {
  const color = accentKey.split('.')[0];
  const main = theme.palette[color]?.main ?? theme.palette.divider;
  return alpha(main, amount);
}

function userDisplayName(user) {
  const full = `${user.family} ${user.name}`.trim();
  return full || user.mobile || `کاربر ${user.id}`;
}

function matchesFilter(text, query) {
  if (!query) return true;
  return text.toLowerCase().includes(query);
}

function computeVisibleBranchIds(forest, usersByBranchId, filterQuery) {
  const q = filterQuery.trim().toLowerCase();
  if (!q) return null;

  const visible = new Set();

  const visit = (node) => {
    const users = usersByBranchId.get(node.id) || [];
    const branchMatches =
      matchesFilter(node.title, q) || matchesFilter(String(node.id), q);
    const userMatches = users.some((u) => {
      const blob = `${u.name} ${u.family} ${u.mobile} ${u.role_title}`.toLowerCase();
      return matchesFilter(blob, q);
    });

    let childVisible = false;
    node.children.forEach((child) => {
      if (visit(child)) childVisible = true;
    });

    if (branchMatches || userMatches || childVisible) {
      visible.add(node.id);
      return true;
    }
    return false;
  };

  forest.forEach(visit);
  return visible;
}

function BranchUsersBlock({
  users,
  depth,
  filterQuery,
  dragUserId,
  onUserDragStart,
  onUserDragEnd,
  onUserClick,
}) {
  const q = filterQuery.trim().toLowerCase();
  const visible = q
    ? users.filter((u) => {
        const blob = `${u.name} ${u.family} ${u.mobile} ${u.role_title}`.toLowerCase();
        return matchesFilter(blob, q);
      })
    : users;

  if (visible.length === 0) {
    return null;
  }

  const scrollable = visible.length >= USER_LIST_SCROLL_THRESHOLD;

  return (
    <Box
      sx={(theme) => ({
        mr: 2 + depth * 2,
        mb: 0.75,
        pr: 1,
        pl: 1.5,
        maxHeight: scrollable ? USER_LIST_MAX_HEIGHT : 'none',
        overflowY: scrollable ? 'auto' : 'visible',
        borderRadius: 1.25,
        borderRight: '3px solid',
        borderColor: alpha(theme.palette.success.main, 0.55),
        bgcolor: alpha(theme.palette.success.main, 0.06),
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-thumb': {
          borderRadius: 3,
          bgcolor: 'action.disabled',
        },
      })}
    >
      {visible.map((user) => {
        const isDragging = dragUserId === user.id;
        const label = userDisplayName(user);
        return (
          <Box
            key={user.id}
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              py: 0.5,
              px: 0.75,
              mb: 0.35,
              borderRadius: 1,
              opacity: isDragging ? 0.45 : 1,
              border: '1px solid',
              borderColor: alpha(theme.palette.success.main, 0.22),
              bgcolor: theme.palette.background.paper,
              boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`,
            })}
          >
            <Box
              draggable
              onDragStart={(event) => onUserDragStart(event, user.id)}
              onDragEnd={onUserDragEnd}
              onClick={(event) => event.stopPropagation()}
              sx={{ display: 'flex', cursor: 'grab', p: 0.2, flexShrink: 0 }}
              aria-label="جابجایی کاربر"
            >
              <Icon icon="mdi:drag" width={16} style={{ opacity: 0.45 }} />
            </Box>

            <Box
              role="button"
              tabIndex={0}
              onClick={() => onUserClick(user.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onUserClick(user.id);
                }
              }}
              sx={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                cursor: 'pointer',
                borderRadius: 0.75,
                py: 0.15,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Icon
                icon="mdi:account-circle-outline"
                width={18}
                style={{ flexShrink: 0, opacity: 0.85 }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontSize: '0.8125rem' }}>
                  {label}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user.mobile || `شناسه ${user.id}`}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.35} sx={{ flexShrink: 0 }}>
                {user.role_title ? (
                  <Chip
                    size="small"
                    label={user.role_title}
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                ) : null}
                <Chip
                  size="small"
                  label={user.verified ? 'تایید شده' : 'تایید نشده'}
                  color={user.verified ? 'info' : 'warning'}
                  variant="soft"
                  sx={{ height: 22, fontSize: '0.7rem' }}
                />
                <Chip
                  size="small"
                  label={user.active ? 'فعال' : 'غیرفعال'}
                  color={user.active ? 'success' : 'default'}
                  variant="soft"
                  sx={{ height: 22, fontSize: '0.7rem' }}
                />
              </Stack>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function TreeNodeRow({
  node,
  depth,
  expandedIds,
  usersByBranchId,
  filterQuery,
  visibleBranchIds,
  onToggle,
  onNodeClick,
  onUserClick,
  dragBranchId,
  dragUserId,
  dropTargetId,
  onBranchDragStart,
  onUserDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  const users = usersByBranchId.get(node.id) || [];
  const hasChildren = node.children.length > 0;
  const hasUsers = users.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isDraggingBranch = dragBranchId === node.id;
  const isDropTarget = dropTargetId === node.id;
  const canExpand = hasChildren || hasUsers;

  if (visibleBranchIds && !visibleBranchIds.has(node.id)) {
    return null;
  }

  const depthStyle = branchDepthStyle(depth, node.is_central);
  const indent = depth * 2.25;

  return (
    <Box
      sx={{
        position: 'relative',
        mr: indent,
        ...(depth > 0 && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            bottom: 12,
            right: -10,
            width: 2,
            borderRadius: 1,
            bgcolor: 'divider',
          },
        }),
      }}
    >
      <Box
        onDragOver={(event) => onDragOver(event, node.id)}
        onDrop={(event) => onDrop(event, node.id)}
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 0.85,
          px: 1.1,
          mb: 0.5,
          borderRadius: 1.5,
          opacity: isDraggingBranch ? 0.45 : 1,
          border: '1px solid',
          borderColor: isDropTarget
            ? 'primary.main'
            : alpha(theme.palette[depthStyle.accent.split('.')[0]].main, 0.35),
          borderRightWidth: 4,
          borderRightColor: isDropTarget ? 'primary.main' : depthStyle.accent,
          bgcolor: isDropTarget
            ? 'action.hover'
            : depthBg(theme, depthStyle.accent, node.is_central ? 0.12 : 0.08),
          boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.06)}`,
        })}
      >
        {canExpand ? (
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onToggle(node.id);
            }}
            sx={{ p: 0.25 }}
            aria-label={isExpanded ? 'بستن' : 'باز کردن'}
          >
            <Icon
              icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-left'}
              width={20}
            />
          </IconButton>
        ) : (
          <Box sx={{ width: 28 }} />
        )}

        <Box
          draggable
          onDragStart={(event) => onBranchDragStart(event, node.id)}
          onDragEnd={onDragEnd}
          onClick={(event) => event.stopPropagation()}
          sx={{ display: 'flex', cursor: 'grab', p: 0.25, flexShrink: 0 }}
          aria-label="جابجایی شعبه"
        >
          <Icon icon="mdi:drag" width={18} style={{ opacity: 0.5 }} />
        </Box>

        <Box
          role="button"
          tabIndex={0}
          onClick={() => onNodeClick(node.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onNodeClick(node.id);
            }
          }}
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            borderRadius: 0.75,
            py: 0.25,
            px: 0.5,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              bgcolor: (theme) =>
                alpha(theme.palette[depthStyle.accent.split('.')[0]].main, 0.16),
              color: depthStyle.icon,
            }}
          >
            <Icon
              icon={node.is_central ? 'mdi:source-branch' : 'mdi:store-outline'}
              width={20}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {node.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              شناسه {node.id}
              {hasUsers ? ` · ${users.length} کاربر` : ''}
            </Typography>
          </Box>

          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
            {hasUsers ? (
              <Chip
                size="small"
                icon={<Icon icon="mdi:account-group-outline" width={14} />}
                label={String(users.length)}
                variant="outlined"
              />
            ) : null}
            {node.is_central ? (
              <Chip size="small" label="مرکزی" color="info" variant="soft" />
            ) : null}
            <Chip
              size="small"
              label={node.is_active ? 'فعال' : 'غیرفعال'}
              color={node.is_active ? 'success' : 'default'}
              variant="soft"
            />
            <Chip
              size="small"
              label={node.review_required ? 'بازبینی اجباری' : 'بدون بازبینی'}
              color={node.review_required ? 'warning' : 'secondary'}
              variant="soft"
            />
            {node.open_review_tasks > 0 ? (
              <Chip
                size="small"
                icon={<Icon icon="mdi:clipboard-text-search-outline" width={14} />}
                label={`بازبینی: ${node.open_review_tasks}`}
                color="error"
                variant="soft"
              />
            ) : null}
            {node.open_continue_tasks > 0 ? (
              <Chip
                size="small"
                icon={<Icon icon="mdi:play-circle-outline" width={14} />}
                label={`ادامه: ${node.open_continue_tasks}`}
                color="primary"
                variant="soft"
              />
            ) : null}
          </Stack>
        </Box>
      </Box>

      <Collapse in={isExpanded}>
        {hasUsers ? (
          <BranchUsersBlock
            users={users}
            depth={depth}
            filterQuery={filterQuery}
            dragUserId={dragUserId}
            onUserDragStart={onUserDragStart}
            onUserDragEnd={onDragEnd}
            onUserClick={onUserClick}
          />
        ) : null}

        {hasChildren ? (
          <Box
            sx={(theme) => ({
              mr: 1.5,
              pr: 0.5,
              borderRight: '2px dashed',
              borderColor: alpha(
                theme.palette[depthStyle.accent.split('.')[0]].main,
                0.35
              ),
            })}
          >
            {node.children.map((child) => (
              <TreeNodeRow
                key={child.id}
                node={child}
                depth={depth + 1}
                expandedIds={expandedIds}
                usersByBranchId={usersByBranchId}
                filterQuery={filterQuery}
                visibleBranchIds={visibleBranchIds}
                onToggle={onToggle}
                onNodeClick={onNodeClick}
                onUserClick={onUserClick}
                dragBranchId={dragBranchId}
                dragUserId={dragUserId}
                dropTargetId={dropTargetId}
                onBranchDragStart={onBranchDragStart}
                onUserDragStart={onUserDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDrop={onDrop}
              />
            ))}
          </Box>
        ) : null}
      </Collapse>
    </Box>
  );
}

function TreeLegend() {
  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap={1}
      sx={(theme) => ({
        py: 0.75,
        px: 1,
        borderRadius: 1,
        bgcolor: alpha(theme.palette.grey[500], 0.08),
      })}
    >
      <Chip
        size="small"
        variant="outlined"
        label="شعبه — نوار رنگی = عمق درخت"
        sx={{ borderRightWidth: 4, borderRightColor: 'info.main' }}
      />
      <Chip
        size="small"
        variant="outlined"
        label="کاربران — پس‌زمینه سبز"
        sx={{ borderRightWidth: 3, borderRightColor: 'success.main' }}
      />
      <Chip size="small" label="تایید شده" color="info" variant="soft" />
      <Chip size="small" label="تایید نشده" color="warning" variant="soft" />
      <Chip
        size="small"
        icon={<Icon icon="mdi:clipboard-text-search-outline" width={14} />}
        label="تسک بازبینی"
        color="error"
        variant="soft"
      />
      <Chip
        size="small"
        icon={<Icon icon="mdi:play-circle-outline" width={14} />}
        label="تسک ادامه فرایند"
        color="primary"
        variant="soft"
      />
    </Stack>
  );
}

export function BranchTreeEditor({
  nodes,
  parentById,
  onParentByIdChange,
  usersByBranchId,
  onUsersByBranchIdChange,
}) {
  const router = useRouter();
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [dragBranchId, setDragBranchId] = useState(null);
  const [dragUserId, setDragUserId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [moveError, setMoveError] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const forest = useMemo(
    () => buildBranchForest(nodes, parentById),
    [nodes, parentById]
  );

  const visibleBranchIds = useMemo(
    () => computeVisibleBranchIds(forest, usersByBranchId, filterQuery),
    [forest, usersByBranchId, filterQuery]
  );

  useEffect(() => {
    const q = filterQuery.trim();
    if (!q || !visibleBranchIds?.size) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      visibleBranchIds.forEach((id) => next.add(id));
      return next;
    });
  }, [filterQuery, visibleBranchIds]);

  const totalUsers = useMemo(() => {
    let count = 0;
    usersByBranchId.forEach((users) => {
      count += users.length;
    });
    return count;
  }, [usersByBranchId]);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(nodes.map((n) => n.id)));
  }, [nodes]);

  useEffect(() => {
    if (nodes.length > 0) {
      setExpandedIds(new Set(nodes.map((n) => n.id)));
    }
  }, [nodes]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const handleToggle = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleNodeClick = useCallback(
    (branchId) => {
      router.push(paths.dashboard.branch.edit(branchId));
    },
    [router]
  );

  const handleUserClick = useCallback(
    (userId) => {
      router.push(paths.dashboard.user.edit(userId));
    },
    [router]
  );

  const applyBranchMove = useCallback(
    (branchId, newParentId) => {
      const error = validateBranchMove({
        branchId,
        newParentId,
        nodesById,
        parentById,
      });
      if (error) {
        setMoveError(error);
        return;
      }
      setMoveError('');
      const next = cloneParentMap(parentById);
      next.set(branchId, newParentId || 0);
      onParentByIdChange(next);
      if (newParentId > 0) {
        setExpandedIds((prev) => {
          const expanded = new Set(prev);
          expanded.add(newParentId);
          expanded.add(branchId);
          return expanded;
        });
      }
    },
    [nodesById, onParentByIdChange, parentById]
  );

  const applyUserMove = useCallback(
    (userId, targetBranchId) => {
      const error = validateUserMove({
        userId,
        targetBranchId,
        usersByBranchId,
        nodesById,
      });
      if (error) {
        setMoveError(error);
        return;
      }
      setMoveError('');
      onUsersByBranchIdChange(applyUserMoveInMap(usersByBranchId, userId, targetBranchId));
      setExpandedIds((prev) => {
        const expanded = new Set(prev);
        expanded.add(targetBranchId);
        return expanded;
      });
    },
    [nodesById, onUsersByBranchIdChange, usersByBranchId]
  );

  const handleBranchDragStart = useCallback((event, branchId) => {
    event.dataTransfer.effectAllowed = 'move';
    const payload = encodeTreeDragPayload('branch', branchId);
    event.dataTransfer.setData(TREE_DRAG_MIME, payload);
    event.dataTransfer.setData('text/plain', payload);
    setDragBranchId(branchId);
    setDragUserId(null);
    setMoveError('');
  }, []);

  const handleUserDragStart = useCallback((event, userId) => {
    event.dataTransfer.effectAllowed = 'move';
    const payload = encodeTreeDragPayload('user', userId);
    event.dataTransfer.setData(TREE_DRAG_MIME, payload);
    event.dataTransfer.setData('text/plain', payload);
    setDragUserId(userId);
    setDragBranchId(null);
    setMoveError('');
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragBranchId(null);
    setDragUserId(null);
    setDropTargetId(null);
  }, []);

  const handleDragOver = useCallback((event, targetId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTargetId(targetId);
  }, []);

  const handleDrop = useCallback(
    (event, targetId) => {
      event.preventDefault();
      const raw =
        event.dataTransfer.getData(TREE_DRAG_MIME) ||
        event.dataTransfer.getData('text/plain');
      const payload = decodeTreeDragPayload(raw);
      if (!payload) return;

      if (payload.type === 'branch') {
        const newParentId = targetId === ROOT_DROP_ID ? 0 : Number(targetId);
        applyBranchMove(payload.id, newParentId);
      } else if (payload.type === 'user' && targetId !== ROOT_DROP_ID) {
        applyUserMove(payload.id, Number(targetId));
      }

      setDragBranchId(null);
      setDragUserId(null);
      setDropTargetId(null);
    },
    [applyBranchMove, applyUserMove]
  );

  const rootDropActive = dropTargetId === ROOT_DROP_ID;

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
      >
        <TextField
          size="small"
          placeholder="جستجو در شعب و کاربران..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          sx={{ minWidth: { sm: 280 }, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="mdi:magnify" width={20} />
              </InputAdornment>
            ),
          }}
        />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Chip
            size="small"
            variant="outlined"
            label={`${totalUsers} کاربر`}
            sx={{ pointerEvents: 'none' }}
          />
          <Chip
            size="small"
            variant="outlined"
            label="باز کردن همه"
            onClick={expandAll}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            size="small"
            variant="outlined"
            label="بستن همه"
            onClick={collapseAll}
            sx={{ cursor: 'pointer' }}
          />
        </Stack>
      </Stack>

      <TreeLegend />

      {moveError ? <Alert severity="warning">{moveError}</Alert> : null}

      <Typography variant="caption" color="text.secondary">
        برای ویرایش روی نام شعبه یا کاربر کلیک کنید. شعب و کاربران را با آیکن کشیدن جابجا
        کنید؛ شعبه را روی شعبه مرکزی یا ناحیه ریشه، کاربر را روی شعبه مقصد رها کنید.
      </Typography>

      <Box
        onDragOver={(event) => handleDragOver(event, ROOT_DROP_ID)}
        onDrop={(event) => handleDrop(event, ROOT_DROP_ID)}
        sx={{
          p: 1.5,
          borderRadius: 1,
          border: '1px dashed',
          borderColor: rootDropActive ? 'primary.main' : 'divider',
          bgcolor: rootDropActive ? 'action.hover' : 'background.neutral',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Icon icon="mdi:tree-outline" width={20} />
          <Typography variant="body2" color="text.secondary">
            رها کردن اینجا — شعبه در سطح ریشه (بدون والد)
          </Typography>
        </Stack>
      </Box>

      {forest.length === 0 ? (
        <Alert severity="info">شعبه‌ای برای نمایش یافت نشد.</Alert>
      ) : (
        <Box>
          {forest.map((node) => (
            <TreeNodeRow
              key={node.id}
              node={node}
              depth={0}
              expandedIds={expandedIds}
              usersByBranchId={usersByBranchId}
              filterQuery={filterQuery}
              visibleBranchIds={visibleBranchIds}
              onToggle={handleToggle}
              onNodeClick={handleNodeClick}
              onUserClick={handleUserClick}
              dragBranchId={dragBranchId}
              dragUserId={dragUserId}
              dropTargetId={dropTargetId}
              onBranchDragStart={handleBranchDragStart}
              onUserDragStart={handleUserDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </Box>
      )}
    </Stack>
  );
}
