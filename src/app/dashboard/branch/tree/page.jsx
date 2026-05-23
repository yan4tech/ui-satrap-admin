'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Icon } from '@iconify/react';

import { BranchTreeEditor } from 'src/components/branch/BranchTreeEditor';
import {
  assignBranchParent,
  fetchBranchesForTree,
  moveUserToBranch,
} from 'src/lib/branch-api';
import {
  cloneParentMap,
  cloneUsersByBranchMap,
  collectParentChanges,
  collectUserBranchChanges,
  normalizeBranchTreeNode,
  orderParentChanges,
  parentMapFromNodes,
  usersByBranchFromRawRows,
} from 'src/lib/branch-tree';
import { extractMembershipErrorMessage } from 'src/lib/membership-errors';
import { paths } from 'src/routes/paths';

export default function BranchTreePage() {
  const router = useRouter();

  const [nodes, setNodes] = useState([]);
  const [initialParentById, setInitialParentById] = useState(() => new Map());
  const [parentById, setParentById] = useState(() => new Map());
  const [initialUsersByBranchId, setInitialUsersByBranchId] = useState(() => new Map());
  const [usersByBranchId, setUsersByBranchId] = useState(() => new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadTree = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await fetchBranchesForTree();
      const normalized = rows.map(normalizeBranchTreeNode).filter(Boolean);
      const map = parentMapFromNodes(normalized);
      const usersMap = usersByBranchFromRawRows(rows);
      setNodes(normalized);
      setInitialParentById(cloneParentMap(map));
      setParentById(cloneParentMap(map));
      setInitialUsersByBranchId(cloneUsersByBranchMap(usersMap));
      setUsersByBranchId(cloneUsersByBranchMap(usersMap));
    } catch (err) {
      console.error(err);
      setLoadError(extractMembershipErrorMessage(err, 'خطا در بارگذاری درخت شعب'));
      setNodes([]);
      setInitialParentById(new Map());
      setParentById(new Map());
      setInitialUsersByBranchId(new Map());
      setUsersByBranchId(new Map());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const branchDirty = useMemo(() => {
    if (initialParentById.size !== parentById.size) return true;
    let dirty = false;
    parentById.forEach((pid, id) => {
      if ((initialParentById.get(id) || 0) !== (pid || 0)) dirty = true;
    });
    return dirty;
  }, [initialParentById, parentById]);

  const userDirty = useMemo(
    () => collectUserBranchChanges(initialUsersByBranchId, usersByBranchId).length > 0,
    [initialUsersByBranchId, usersByBranchId]
  );

  const isDirty = branchDirty || userDirty;

  const handleReset = () => {
    setParentById(cloneParentMap(initialParentById));
    setUsersByBranchId(cloneUsersByBranchMap(initialUsersByBranchId));
    setSnackbar({ open: true, message: 'تغییرات لغو شد', severity: 'info' });
  };

  const handleSave = async () => {
    const branchChanges = collectParentChanges(initialParentById, parentById);
    const userChanges = collectUserBranchChanges(initialUsersByBranchId, usersByBranchId);

    if (branchChanges.length === 0 && userChanges.length === 0) {
      setSnackbar({ open: true, message: 'تغییری برای ثبت وجود ندارد', severity: 'info' });
      return;
    }

    setSaving(true);
    try {
      if (branchChanges.length > 0) {
        const ordered = orderParentChanges(branchChanges, parentById);
        for (const change of ordered) {
          await assignBranchParent(change.branchId, change.parentId);
        }
      }

      for (const change of userChanges) {
        await moveUserToBranch(change.userId, change.branchId);
      }

      const parts = [];
      if (branchChanges.length > 0) {
        parts.push(`${branchChanges.length} شعبه`);
      }
      if (userChanges.length > 0) {
        parts.push(`${userChanges.length} کاربر`);
      }

      setSnackbar({
        open: true,
        message: `تغییرات با موفقیت ثبت شد (${parts.join(' و ')})`,
        severity: 'success',
      });
      await loadTree();
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: extractMembershipErrorMessage(err, 'خطا در ثبت تغییرات'),
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Icon icon="mdi:file-tree" width={28} />
              <Box>
                <Typography variant="h5">درخت شعب</Typography>
                <Typography variant="body2" color="text.secondary">
                  جابجایی شعب و کاربران با کشیدن و رها کردن؛ پس از اتمام «ثبت نهایی» را بزنید
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="outlined"
              startIcon={<Icon icon="mdi:arrow-right" width={18} />}
              onClick={() => router.push(paths.dashboard.branch.search)}
            >
              بازگشت به لیست
            </Button>
          </Stack>

          {loadError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loadError}
            </Alert>
          ) : null}

          {loading ? (
            <Typography color="text.secondary">در حال بارگذاری...</Typography>
          ) : (
            <BranchTreeEditor
              nodes={nodes}
              parentById={parentById}
              onParentByIdChange={setParentById}
              usersByBranchId={usersByBranchId}
              onUsersByBranchIdChange={setUsersByBranchId}
            />
          )}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            justifyContent="flex-end"
            sx={{ mt: 3, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}
          >
            <Button variant="outlined" disabled={!isDirty || saving} onClick={handleReset}>
              انصراف از تغییرات
            </Button>
            <LoadingButton
              variant="contained"
              color="success"
              loading={saving}
              disabled={!isDirty || loading}
              onClick={handleSave}
            >
              ثبت نهایی
            </LoadingButton>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClick={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
