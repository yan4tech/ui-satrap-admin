'use client';

import { z as zod } from 'zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Button,
  Card,
  CardContent,
  Typography,
  MenuItem,
  Alert,
  Container,
  Divider,
  Stack,
  Chip,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { Form, Field } from 'src/components/hook-form';
import { paths } from 'src/routes/paths';
import {
  updateUser,
  fetchAssignableRolesOptions,
  fetchRoleById,
  fetchBranchesOptions,
} from './user-api';
import { UserScopeFields } from './user-scope-fields';
import { UserStatusFields } from './user-status-fields';
import {
  branchIdForPayload,
  resolveAssignableRoleContext,
} from './user-scope-utils';
import { CONFIG } from 'src/global-config';

const UserSchema = zod.object({
  name: zod.string().optional(),
  family: zod.string().optional(),
  email: zod.union([zod.string().email(), zod.literal('')]).optional(),
  mobile: zod.string().min(10),
  role_id: zod.number().min(0),
  branch_id: zod.number().min(0),
  active: zod.boolean(),
  verified: zod.boolean(),
});

/**
 * @param {{ user: object, readOnly?: boolean, onSaved?: () => Promise<void> }} props
 */
export default function EditUserView({ user, readOnly, onSaved }) {
  const router = useRouter();
  const userId = Number(user?.id ?? user?.ID ?? 0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [deleteDocumentIds, setDeleteDocumentIds] = useState([]);
  const [selectedRoleInfo, setSelectedRoleInfo] = useState(null);
  const [roleInfoLoading, setRoleInfoLoading] = useState(false);
  const [roleDetailsOpen, setRoleDetailsOpen] = useState(false);
  const [newDocuments, setNewDocuments] = useState([
    { rowId: Date.now(), title: '', file: null, previewUrl: null },
  ]);

  const methods = useForm({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      name: '',
      family: '',
      email: '',
      mobile: '',
      role_id: 1,
      branch_id: 0,
      active: true,
      verified: false,
    },
  });

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = methods;
  const selectedRoleId = watch('role_id');
  const selectedBranchId = watch('branch_id');
  const activeValue = watch('active');
  const verifiedValue = watch('verified');
  const formValues = watch();

  // فقط هنگام بارگذاری/تعویض رکورد کاربر reset شود — نه با هر بار تغییر roles
  const loadedUserKey = user
    ? `${user.id ?? user.ID ?? ''}-${user.updated_at ?? user.UpdatedAt ?? ''}`
    : '';

  useEffect(() => {
    if (!user || !loadedUserKey) return;
    reset({
      name: user.name,
      family: user.family,
      email: user.email ?? '',
      mobile: user.mobile,
      role_id: Number(user.role_id || 0),
      branch_id: Number(user.branch_id || 0),
      active: user.active,
      verified: user.verified,
    });
    setDocuments(Array.isArray(user.documents) ? user.documents : []);
    setDeleteDocumentIds([]);
    setNewDocuments([{ rowId: Date.now(), title: '', file: null, previewUrl: null }]);
  }, [loadedUserKey, user, reset]);

  useEffect(() => {
    (async () => {
      try {
        setBranches(await fetchBranchesOptions());
      } catch {
        setErrorMessage('خطا در دریافت لیست شعب');
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let roleRows = await fetchAssignableRolesOptions(
          resolveAssignableRoleContext({
            branchId: selectedBranchId,
          })
        );
        const userRoleId = Number(user?.role_id ?? 0);
        if (userRoleId > 0 && !roleRows.some((r) => r.id === userRoleId)) {
          const current = await fetchRoleById(userRoleId);
          if (current?.id) roleRows = [current, ...roleRows];
        }
        if (cancelled) return;
        setRoles(roleRows);
        const currentRoleId = Number(selectedRoleId ?? 0);
        const stillValid = roleRows.some((r) => r.id === currentRoleId);
        if (!stillValid && roleRows[0]?.id) {
          setValue('role_id', roleRows[0].id);
        }
      } catch {
        if (!cancelled) setErrorMessage('خطا در دریافت نقش‌های قابل انتساب');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedBranchId, setValue, selectedRoleId, user?.role_id]);

  useEffect(() => {
    let cancelled = false;
    const loadRole = async () => {
      const roleId = Number(selectedRoleId ?? 0);
      if (roleId < 1) {
        setSelectedRoleInfo(null);
        return;
      }
      setRoleInfoLoading(true);
      try {
        const role = await fetchRoleById(roleId);
        if (!cancelled) setSelectedRoleInfo(role);
      } catch {
        if (!cancelled) setSelectedRoleInfo(null);
      } finally {
        if (!cancelled) setRoleInfoLoading(false);
      }
    };
    loadRole();
    return () => {
      cancelled = true;
    };
  }, [selectedRoleId]);

  const addNewDocumentRow = () => {
    setNewDocuments((prev) => [
      ...prev,
      { rowId: Date.now() + Math.random(), title: '', file: null, previewUrl: null },
    ]);
  };

  const removeNewDocumentRow = (rowId) => {
    setNewDocuments((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.rowId !== rowId)));
  };

  const updateNewDocumentRow = (rowId, field, value) => {
    setNewDocuments((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, [field]: value } : row))
    );
  };

  const validDocuments = newDocuments
    .filter((doc) => doc.title.trim() || doc.file)
    .map((doc) => ({ title: doc.title.trim(), file: doc.file }))
    .filter((doc) => doc.title && doc.file);

  const canBeVerified = (data) => {
    const hasName = Boolean(String(data.name ?? '').trim());
    const hasFamily = Boolean(String(data.family ?? '').trim());
    const hasEmail = Boolean(String(data.email ?? '').trim());
    const hasMobile = Boolean(String(data.mobile ?? '').trim());
    const hasRole = Number(data.role_id ?? 0) > 0;
    return hasName && hasFamily && hasEmail && hasMobile && hasRole;
  };
  const isVerifiableNow = canBeVerified(formValues);

  useEffect(() => {
    if (!isVerifiableNow && verifiedValue) {
      setValue('verified', false);
    }
  }, [isVerifiableNow, verifiedValue, setValue]);

  const getDocumentDownloadUrl = (rawPath) => {
    if (!rawPath || rawPath === '-') return null;
    const path = String(rawPath).trim();
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!CONFIG.serverUrl) return `/${normalizedPath}`;
    return `${CONFIG.serverUrl.replace(/\/+$/, '')}/${normalizedPath}`;
  };

  const onSubmit = handleSubmit(async (data) => {
    if (readOnly) return;
    if (!userId) {
      setErrorMessage('شناسه کاربر معتبر نیست');
      return;
    }
    try {
      setErrorMessage(null);
      const roleSlug = String(selectedRoleInfo?.slug ?? '').trim();
      if (
        (roleSlug === 'company-admin' ||
          roleSlug === 'company-reviewer' ||
          roleSlug === 'branch-admin') &&
        Number(data.branch_id) <= 0
      ) {
        setErrorMessage('برای این نقش، انتخاب شعبه الزامی است.');
        return;
      }
      const verified = canBeVerified(data) ? Boolean(data.verified) : false;
      await updateUser(
        userId,
        {
          ...data,
          name: data.name || '',
          family: data.family || '',
          email: data.email || '',
          verified,
          branch_id: branchIdForPayload(data.branch_id),
        },
        validDocuments,
        deleteDocumentIds
      );
      if (onSaved) await onSaved();
      router.push(paths.dashboard.user.search);
    } catch {
      setErrorMessage('خطا در ذخیره');
    }
  });

  return (
    <Container maxWidth={false} disableGutters sx={{ mr: 0 }}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            {readOnly ? 'جزئیات کاربر' : 'ویرایش کاربر'}
          </Typography>
          {readOnly && user && (
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
              <Chip size="small" label={`شناسه: ${userId || '-'}`} />
              <Chip
                size="small"
                label={`نقش: ${roles.find((item) => item.id === Number(user.role_id))?.title || '—'}`}
              />
              <Chip
                size="small"
                label={`شعبه: ${branches.find((item) => item.id === Number(user.branch_id))?.title || '—'}`}
              />
              <Chip
                size="small"
                color={user.active ? 'success' : 'default'}
                label={user.active ? 'فعال' : 'غیرفعال'}
              />
              <Chip
                size="small"
                color={user.verified ? 'info' : 'default'}
                label={user.verified ? 'تأیید شده' : 'تأیید نشده'}
              />
            </Stack>
          )}
          <Divider sx={{ mb: 3 }} />

          {!!errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Form methods={methods} onSubmit={onSubmit}>
            <Stack spacing={3}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  columnGap: 3,
                  rowGap: 2,
                }}
              >
                <Box>
                  <Field.Text name="name" label="نام" disabled={readOnly} />
                </Box>
                <Box>
                  <Field.Text name="family" label="نام خانوادگی" disabled={readOnly} />
                </Box>
                <Box>
                  <Field.Text name="mobile" label="موبایل" disabled={readOnly} />
                </Box>
                <Box>
                  <Field.Text name="email" label="ایمیل" disabled={readOnly} />
                </Box>
                <Box>
                  <Field.Select name="role_id" label="نقش (Role)" disabled={readOnly}>
                    {roles.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.title}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Box>
                <UserScopeFields branches={branches} readOnly={readOnly} />
                <UserStatusFields
                  readOnly={readOnly}
                  activeValue={activeValue}
                  verifiedValue={verifiedValue}
                  isVerifiableNow={isVerifiableNow}
                  onActiveChange={(value) => setValue('active', value)}
                  onVerifiedChange={(value) => setValue('verified', value)}
                />
              </Box>

              <Box>
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: 'background.paper',
                    border: (theme) => `1px solid ${theme.palette.primary.main}`,
                    boxShadow: (theme) => `0 8px 24px ${theme.palette.primary.main}1F`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      insetInlineStart: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      bgcolor: 'primary.main',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        اطلاعات نقش انتخاب‌شده
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {roleInfoLoading
                          ? 'در حال دریافت اطلاعات نقش...'
                          : selectedRoleInfo
                            ? `${selectedRoleInfo.title} (${selectedRoleInfo.slug})`
                            : 'نقشی انتخاب نشده است.'}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => setRoleDetailsOpen(true)}
                      disabled={!selectedRoleInfo?.id}
                    >
                      جزئیات
                    </Button>
                  </Stack>
                  {selectedRoleInfo?.id && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                      <Chip size="small" label={`شناسه: ${selectedRoleInfo.id}`} />
                      <Chip
                        size="small"
                        label={selectedRoleInfo.active ? 'فعال' : 'غیرفعال'}
                        color={selectedRoleInfo.active ? 'success' : 'default'}
                      />
                    </Stack>
                  )}
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: (theme) => `1px solid ${theme.palette.info.main}`,
                    boxShadow: (theme) => `0 8px 24px ${theme.palette.info.main}1A`,
                    backgroundColor: 'background.paper',
                    mb: 2,
                  }}
                >
                  <Typography fontWeight={700} sx={{ mb: 1.5 }}>
                    مدارک فعلی
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderColor: 'info.light' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'info.lighter' }}>
                          <TableCell>برچسب</TableCell>
                          <TableCell>نام فایل</TableCell>
                          <TableCell width={220}>عملیات</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {documents.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3}>مدرکی ثبت نشده است.</TableCell>
                          </TableRow>
                        )}
                        {documents.map((doc, index) => {
                          const docId = Number(doc?.ID ?? doc?.id ?? doc?.document_id ?? 0);
                          const docTitle = doc?.title || doc?.Title || doc?.refer || doc?.Refer || '-';
                          const docPath = doc?.doc_file || doc?.DocFile || '-';
                          const downloadUrl = getDocumentDownloadUrl(docPath);
                          const docFileName = String(docPath).split('/').pop()?.split('\\').pop() || '-';
                          const inDeleteQueue = docId > 0 && deleteDocumentIds.includes(docId);
                          return (
                            <TableRow key={`${docPath}-${index}`}>
                              <TableCell>{docTitle}</TableCell>
                              <TableCell>{docFileName}</TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1}>
                                  <Button
                                    component="a"
                                    href={downloadUrl || undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="outlined"
                                    size="small"
                                    disabled={!downloadUrl}
                                  >
                                    دانلود
                                  </Button>
                                  {!readOnly && (
                                    <Button
                                      type="button"
                                      color={inDeleteQueue ? 'inherit' : 'error'}
                                      variant="outlined"
                                      size="small"
                                      disabled={docId < 1}
                                      onClick={() =>
                                        setDeleteDocumentIds((prev) =>
                                          prev.includes(docId)
                                            ? prev.filter((id) => id !== docId)
                                            : [...prev, docId]
                                        )
                                      }
                                    >
                                      {inDeleteQueue ? 'لغو حذف' : 'حذف'}
                                    </Button>
                                  )}
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>

              {!readOnly && (
                <Box>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: (theme) => `1px solid ${theme.palette.success.main}`,
                      boxShadow: (theme) => `0 8px 24px ${theme.palette.success.main}1A`,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight={700}>مدارک جدید</Typography>
                      <Button type="button" variant="contained" color="success" onClick={addNewDocumentRow}>
                        + افزودن سطر
                      </Button>
                    </Box>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderColor: 'success.light' }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'success.lighter' }}>
                            <TableCell>برچسب مدرک</TableCell>
                            <TableCell>فایل</TableCell>
                            <TableCell width={120}>حذف</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {newDocuments.map((row) => (
                            <TableRow key={row.rowId}>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="مثل contract"
                                  value={row.title}
                                  onChange={(event) =>
                                    updateNewDocumentRow(row.rowId, 'title', event.target.value)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Box
                                  component="label"
                                  sx={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    minHeight: 84,
                                    px: 2,
                                    border: '1px solid',
                                    borderColor: 'text.primary',
                                    borderRadius: 0.5,
                                    cursor: 'pointer',
                                    backgroundColor: 'background.paper',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={(event) => {
                                      const file = event.target.files?.[0] ?? null;

                                      if (!file) {
                                        updateNewDocumentRow(row.rowId, 'file', null);
                                        updateNewDocumentRow(row.rowId, 'previewUrl', null);
                                        return;
                                      }

                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        updateNewDocumentRow(row.rowId, 'file', file);
                                        updateNewDocumentRow(
                                          row.rowId,
                                          'previewUrl',
                                          typeof reader.result === 'string' ? reader.result : null
                                        );
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                  />
                                  {row.previewUrl ? (
                                    <Box
                                      component="img"
                                      src={row.previewUrl}
                                      alt={row.file?.name || 'پیش نمایش تصویر'}
                                      sx={{
                                        width: '100%',
                                        maxHeight: 110,
                                        objectFit: 'contain',
                                        pointerEvents: 'none',
                                      }}
                                    />
                                  ) : (
                                    <>
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          width: '75%',
                                          borderTop: '1px solid',
                                          borderColor: 'text.secondary',
                                          transform: 'rotate(15deg)',
                                          pointerEvents: 'none',
                                        }}
                                      >
                                        &nbsp;
                                      </Box>
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          width: '75%',
                                          borderTop: '1px solid',
                                          borderColor: 'text.secondary',
                                          transform: 'rotate(-15deg)',
                                          pointerEvents: 'none',
                                        }}
                                      >
                                        &nbsp;
                                      </Box>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          zIndex: 1,
                                          px: 1,
                                          backgroundColor: 'background.paper',
                                          maxWidth: '100%',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        تصویر مدرک جدید
                                      </Typography>
                                    </>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  color="error"
                                  variant="outlined"
                                  size="small"
                                  onClick={() => removeNewDocumentRow(row.rowId)}
                                >
                                  حذف
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
              )}

              <Dialog
                open={roleDetailsOpen}
                onClose={() => setRoleDetailsOpen(false)}
                fullWidth
                maxWidth="lg"
              >
                <DialogTitle sx={{ pb: 1 }}>
                  جزئیات نقش
                </DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                  {!!selectedRoleInfo?.id && (
                    <Box
                      component="iframe"
                      src={paths.dashboard.role.details(selectedRoleInfo.id)}
                      sx={{
                        width: '100%',
                        height: '70vh',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        backgroundColor: 'background.paper',
                      }}
                    />
                  )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                  <Button onClick={() => setRoleDetailsOpen(false)} variant="outlined">
                    بستن
                  </Button>
                  <Button
                    variant="contained"
                    disabled={!selectedRoleInfo?.id}
                    onClick={() => {
                      if (!selectedRoleInfo?.id) return;
                      setRoleDetailsOpen(false);
                      router.push(paths.dashboard.role.edit(selectedRoleInfo.id));
                    }}
                  >
                    رفتن به ویرایش نقش
                  </Button>
                </DialogActions>
              </Dialog>

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => router.push(paths.dashboard.user.search)}>
                  بازگشت به لیست
                </Button>
                {!readOnly && (
                  <Button type="submit" variant="contained" loading={isSubmitting}>
                    ذخیره
                  </Button>
                )}
              </Stack>
            </Stack>
          </Form>
        </CardContent>
      </Card>
    </Container>
  );
}
