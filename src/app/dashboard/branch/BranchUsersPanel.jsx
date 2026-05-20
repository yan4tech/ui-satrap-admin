'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Chip,
  Alert,
  Stack,
  Table,
  Paper,
  Button,
  Dialog,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { fetchAssignableRolesOptions } from 'src/app/dashboard/user/user-api';
import { extractMembershipErrorMessage } from 'src/lib/membership-errors';
import { userHasAnyPermission } from 'src/lib/permissions';

import { useAuthContext } from 'src/auth/hooks';

import {
  normalizeId,
  createBranchUser,
  deleteBranchUser,
  fetchBranchUsers,
  assignBranchAdmin,
  isBranchAdminUser,
  BRANCH_ADMIN_ROLE_SLUG,
  countActiveBranchUsers,
} from './branch-users-api';

export default function BranchUsersPanel({
  branchId,
  maxUsers = 0,
  readOnly = false,
  onUsersChanged,
}) {
  const { user: actor } = useAuthContext();
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', family: '', mobile: '', role_id: '' });
  const [saving, setSaving] = useState(false);

  const canManage = userHasAnyPermission(actor, [
    'api.company.central.manage',
    'api.company.tenant.manage',
    'api.branch.users.manage',
  ]);
  const canAssignAdmin = userHasAnyPermission(actor, [
    'api.company.central.manage',
    'api.company.tenant.manage',
  ]);

  const actorType = userHasAnyPermission(actor, ['api.company.central.manage'])
    ? 'company'
    : userHasAnyPermission(actor, ['api.company.tenant.manage'])
      ? 'company_admin'
      : Number(actor?.branch_id ?? 0) > 0
        ? 'branch'
        : '';

  const activeCount = countActiveBranchUsers(rows);
  const quotaLabel =
    maxUsers > 0 ? `${activeCount} / ${maxUsers} کاربر فعال` : `${activeCount} کاربر فعال (بدون سقف)`;

  const load = useCallback(async () => {
    if (!branchId || !actor) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchBranchUsers(branchId, actor);
      setRows(list);
      onUsersChanged?.(list);
    } catch (err) {
      setError(extractMembershipErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [branchId, actor, onUsersChanged]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!dialogOpen) return;
    (async () => {
      try {
        const rows = await fetchAssignableRolesOptions({
          context: 'branch',
          excludeBranchAdmin: true,
        });
        setRoles(rows);
      } catch {
        setRoles([]);
      }
    })();
  }, [dialogOpen]);

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      await createBranchUser(
        branchId,
        {
          name: form.name.trim(),
          family: form.family.trim(),
          mobile: form.mobile.trim(),
          role_id: Number(form.role_id) || undefined,
          active: true,
          branch_id: branchId,
        },
        actor
      );
      setDialogOpen(false);
      setForm({ name: '', family: '', mobile: '', role_id: '' });
      await load();
    } catch (err) {
      setError(extractMembershipErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAssignAdmin = async (userId) => {
    setError(null);
    try {
      await assignBranchAdmin(branchId, userId, actor);
      await load();
    } catch (err) {
      setError(extractMembershipErrorMessage(err));
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('کاربر حذف شود؟')) return;
    setError(null);
    try {
      await deleteBranchUser(branchId, userId, actor);
      await load();
    } catch (err) {
      setError(extractMembershipErrorMessage(err));
    }
  };

  const canView =
    actorType === 'company' ||
    actorType === 'company_admin' ||
    (actorType === 'branch' &&
      Number(actor?.branch_id) === Number(branchId) &&
      String(actor?.role?.slug ?? actor?.role ?? '') === BRANCH_ADMIN_ROLE_SLUG);

  if (!canView) {
    return null;
  }

  return (
    <Box
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography fontWeight={700} sx={{ fontSize: 18 }}>
            کاربران شعبه
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {quotaLabel}
            {maxUsers > 0 && activeCount >= maxUsers && (
              <Chip label="سقف پر شده" color="warning" size="small" sx={{ ml: 1 }} />
            )}
          </Typography>
        </Box>
        {!readOnly && canManage && (
          <Button
            variant="contained"
            size="small"
            onClick={() => setDialogOpen(true)}
            disabled={maxUsers > 0 && activeCount >= maxUsers}
          >
            کاربر جدید
          </Button>
        )}
      </Stack>

      {!!error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>نام</TableCell>
              <TableCell>موبایل</TableCell>
              <TableCell>نقش</TableCell>
              <TableCell>وضعیت</TableCell>
              {!readOnly && <TableCell width={220}>عملیات</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5}>در حال بارگذاری...</TableCell>
              </TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">
                    کاربری ثبت نشده است.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              rows.map((row) => {
                const id = normalizeId(row);
                const isAdmin = isBranchAdminUser(row);
                return (
                  <TableRow key={id} hover>
                    <TableCell>
                      {[row.name, row.family].filter(Boolean).join(' ') || '-'}
                    </TableCell>
                    <TableCell>{row.mobile || '-'}</TableCell>
                    <TableCell>
                      {row.role?.title || row.role?.slug || '-'}
                      {isAdmin && (
                        <Chip label="مدیر شعبه" size="small" color="primary" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell>{row.active ? 'فعال' : 'غیرفعال'}</TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {canAssignAdmin && !isAdmin && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleAssignAdmin(id)}
                            >
                              مدیر شعبه
                            </Button>
                          )}
                          {id !== normalizeId(actor) && (
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => handleDelete(id)}
                            >
                              حذف
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>کاربر جدید شعبه</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="نام"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="نام خانوادگی"
              value={form.family}
              onChange={(e) => setForm((f) => ({ ...f, family: e.target.value }))}
              fullWidth
            />
            <TextField
              label="موبایل"
              value={form.mobile}
              onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
              fullWidth
              placeholder="09xxxxxxxxx"
            />
            <TextField
              select
              label="نقش"
              value={form.role_id}
              onChange={(e) => setForm((f) => ({ ...f, role_id: e.target.value }))}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {roles.map((r) => (
                <MenuItem key={r.id} value={String(r.id)}>
                  {r.title}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>انصراف</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving || !form.mobile.trim()}>
            ثبت
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
