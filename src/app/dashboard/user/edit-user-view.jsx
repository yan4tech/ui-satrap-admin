'use client';

import { z as zod } from 'zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Button,
  ButtonGroup,
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
} from '@mui/material';

import { Form, Field } from 'src/components/hook-form';
import { paths } from 'src/routes/paths';
import {
  updateUser,
  fetchRolesOptions,
  fetchBranchesOptions,
  USER_TYPE_OPTIONS,
} from './user-api';
import { CONFIG } from 'src/global-config';

const UserSchema = zod.object({
  name: zod.string().optional(),
  family: zod.string().optional(),
  email: zod.union([zod.string().email(), zod.literal('')]).optional(),
  mobile: zod.string().min(10),
  role_id: zod.number().min(0),
  branch_id: zod.number().min(0),
  user_type: zod.string().optional(),
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
  const [newDocuments, setNewDocuments] = useState([
    { rowId: Date.now(), title: '', file: null },
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
      user_type: USER_TYPE_OPTIONS[0]?.value ?? 'mobile',
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
  const userType = watch('user_type');
  const activeValue = watch('active');
  const verifiedValue = watch('verified');
  const formValues = watch();

  useEffect(() => {
    if (!user) return;
    reset({
      name: user.name,
      family: user.family,
      email: user.email ?? '',
      mobile: user.mobile,
      role_id: Number(user.role_id || roles[0]?.id || 1),
      branch_id: Number(user.branch_id || 0),
      user_type: String(user.user_type || USER_TYPE_OPTIONS[0]?.value || 'mobile'),
      active: user.active,
      verified: user.verified,
    });
    setDocuments(Array.isArray(user.documents) ? user.documents : []);
    setDeleteDocumentIds([]);
    setNewDocuments([{ rowId: Date.now(), title: '', file: null }]);
  }, [user, reset, roles]);

  useEffect(() => {
    (async () => {
      try {
        const [roleRows, branchRows] = await Promise.all([fetchRolesOptions(), fetchBranchesOptions()]);
        setRoles(roleRows);
        setBranches(branchRows);
      } catch {
        setErrorMessage('خطا در دریافت لیست نقش‌ها و شعب');
      }
    })();
  }, []);

  useEffect(() => {
    if (userType !== 'branch') {
      setValue('branch_id', 0);
    }
  }, [userType, setValue]);

  const addNewDocumentRow = () => {
    setNewDocuments((prev) => [...prev, { rowId: Date.now() + Math.random(), title: '', file: null }]);
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
    const hasUserType = Boolean(String(data.user_type ?? '').trim());
    const hasRole = Number(data.role_id ?? 0) > 0;
    const hasBranch = data.user_type !== 'branch' || Number(data.branch_id ?? 0) > 0;
    return hasName && hasFamily && hasEmail && hasMobile && hasUserType && hasRole && hasBranch;
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
      const verified = canBeVerified(data) ? Boolean(data.verified) : false;
      await updateUser(
        userId,
        {
          ...data,
          name: data.name || '',
          family: data.family || '',
          email: data.email || '',
          user_type: data.user_type || USER_TYPE_OPTIONS[0]?.value || 'mobile',
          verified,
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
                  <Field.Select name="user_type" label="نوع کاربر" disabled={readOnly}>
                    {USER_TYPE_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
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
                {userType === 'branch' && (
                  <Box>
                    <Field.Select name="branch_id" label="شعبه" disabled={readOnly}>
                      <MenuItem value={0}>بدون شعبه</MenuItem>
                      {branches.map((b) => (
                        <MenuItem key={b.id} value={b.id}>
                          {b.title}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Box>
                )}
                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                      columnGap: 3,
                      rowGap: 2,
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Typography variant="body2">وضعیت</Typography>
                      <ButtonGroup>
                        <Button
                          color="success"
                          variant={activeValue ? 'contained' : 'outlined'}
                          disabled={readOnly}
                          onClick={() => setValue('active', true)}
                        >
                          فعال
                        </Button>
                        <Button
                          color="error"
                          variant={!activeValue ? 'contained' : 'outlined'}
                          disabled={readOnly}
                          onClick={() => setValue('active', false)}
                        >
                          غیرفعال
                        </Button>
                      </ButtonGroup>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Typography variant="body2">تایید شده</Typography>
                      <ButtonGroup>
                        <Button
                          color="success"
                          variant={verifiedValue ? 'contained' : 'outlined'}
                          disabled={readOnly || !isVerifiableNow}
                          onClick={() => setValue('verified', true)}
                        >
                          بله
                        </Button>
                        <Button
                          color="error"
                          variant={!verifiedValue ? 'contained' : 'outlined'}
                          disabled={readOnly}
                          onClick={() => setValue('verified', false)}
                        >
                          خیر
                        </Button>
                      </ButtonGroup>
                    </Stack>
                  </Box>
                </Box>
              </Box>

              <Box>
                <Typography fontWeight={600} sx={{ mb: 1.5 }}>
                  مدارک فعلی
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
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

              {!readOnly && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography fontWeight={600}>مدارک جدید</Typography>
                    <Button type="button" variant="contained" color="success" onClick={addNewDocumentRow}>
                      + افزودن سطر
                    </Button>
                  </Box>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
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
                              <Button variant="outlined" component="label" size="small">
                                {row.file?.name || 'انتخاب فایل'}
                                <input
                                  type="file"
                                  hidden
                                  onChange={(event) =>
                                    updateNewDocumentRow(row.rowId, 'file', event.target.files?.[0] ?? null)
                                  }
                                />
                              </Button>
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
              )}

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
