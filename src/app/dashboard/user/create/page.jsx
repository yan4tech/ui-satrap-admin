'use client';

import { z as zod } from 'zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
} from '@mui/material';

import { Form, Field } from 'src/components/hook-form';
import { paths } from 'src/routes/paths';
import {
  createUser,
  fetchRolesOptions,
  fetchRoleById,
  fetchBranchesOptions,
  USER_TYPE_OPTIONS,
} from '../user-api';

const UserSchema = zod.object({
  name: zod.string().optional(),
  family: zod.string().optional(),
  email: zod.union([zod.string().email(), zod.literal('')]).optional(),
  mobile: zod.string().min(10, 'موبایل معتبر وارد کنید'),
  role_id: zod.number().min(0),
  branch_id: zod.number().min(0),
  user_type: zod.string().optional(),
  active: zod.boolean(),
});

export default function CreateUserPage() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedRoleInfo, setSelectedRoleInfo] = useState(null);
  const [roleInfoLoading, setRoleInfoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
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
      role_id: 0,
      branch_id: 0,
      user_type: USER_TYPE_OPTIONS[0]?.value ?? 'mobile',
      active: true,
    },
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = methods;
  const userType = watch('user_type');
  const selectedRoleId = watch('role_id');
  const activeValue = watch('active');

  useEffect(() => {
    (async () => {
      try {
        const [roleRows, branchRows] = await Promise.all([fetchRolesOptions(), fetchBranchesOptions()]);
        setRoles(roleRows);
        setBranches(branchRows);
        if (roleRows[0]?.id) setValue('role_id', roleRows[0].id);
      } catch {
        setErrorMessage('خطا در دریافت لیست نقش‌ها و شعب');
      }
    })();
  }, [setValue]);

  useEffect(() => {
    if (userType !== 'branch') {
      setValue('branch_id', 0);
    }
  }, [userType, setValue]);

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

  const validDocuments = newDocuments
    .filter((doc) => doc.title.trim() || doc.file)
    .map((doc) => ({ title: doc.title.trim(), file: doc.file }))
    .filter((doc) => doc.title && doc.file);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);
      await createUser({
        ...data,
        name: data.name || '',
        family: data.family || '',
        user_type: data.user_type || USER_TYPE_OPTIONS[0]?.value || 'mobile',
        email: data.email || '',
      }, validDocuments);
      router.push(paths.dashboard.user.search);
    } catch {
      setErrorMessage('خطا در ثبت کاربر');
    }
  });

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

  const sectionSx = {
    borderRadius: 2.5,
    p: { xs: 2, md: 3 },
    borderColor: 'divider',
    backgroundColor: 'background.neutral',
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ mr: 0 }}>
      <Card
        sx={{
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          boxShadow: (theme) => theme.customShadows?.z8 || theme.shadows[8],
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Box
            sx={{
              mb: 3,
              px: { xs: 2, md: 3 },
              py: 2.5,
              borderRadius: 2.5,
              color: 'primary.contrastText',
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 60%, ${theme.palette.primary.light} 100%)`,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  کاربر جدید
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  اطلاعات کاربر را کامل کنید و در پایان ثبت را بزنید.
                </Typography>
              </Box>
              <Chip
                label="فرم ایجاد"
                sx={{
                  color: 'common.white',
                  bgcolor: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.28)',
                }}
              />
            </Stack>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {!!errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Form methods={methods} onSubmit={onSubmit}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={sectionSx}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  اطلاعات پایه
                </Typography>
                <Stack
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                    columnGap: 3,
                    rowGap: 2,
                  }}
                >
                  <Stack>
                    <Field.Text name="name" label="نام" />
                  </Stack>
                  <Stack>
                    <Field.Text name="family" label="نام خانوادگی" />
                  </Stack>
                  <Stack>
                    <Field.Text name="mobile" label="موبایل" />
                  </Stack>
                  <Stack>
                    <Field.Text name="email" label="ایمیل" />
                  </Stack>
                  <Stack>
                    <Field.Select name="user_type" label="نوع کاربر">
                      {USER_TYPE_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Stack>
                  <Stack>
                    <Field.Select name="role_id" label="نقش (Role)">
                      {roles.map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.title}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Stack>
                  {userType === 'branch' && (
                    <Stack>
                      <Field.Select name="branch_id" label="شعبه">
                        <MenuItem value={0}>بدون شعبه</MenuItem>
                        {branches.map((b) => (
                          <MenuItem key={b.id} value={b.id}>
                            {b.title}
                          </MenuItem>
                        ))}
                      </Field.Select>
                    </Stack>
                  )}
                  <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                    <Box
                      sx={{
                        mt: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: (theme) => `1px dashed ${theme.palette.divider}`,
                      }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        وضعیت کاربر
                      </Typography>
                      <ButtonGroup>
                        <Button
                          color="success"
                          variant={activeValue ? 'contained' : 'outlined'}
                          onClick={() => setValue('active', true)}
                        >
                          فعال
                        </Button>
                        <Button
                          color="error"
                          variant={!activeValue ? 'contained' : 'outlined'}
                          onClick={() => setValue('active', false)}
                        >
                          غیرفعال
                        </Button>
                      </ButtonGroup>
                    </Box>
                  </Box>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={sectionSx}>
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
                      component={Link}
                      href={
                        selectedRoleInfo?.id
                          ? paths.dashboard.role.details(selectedRoleInfo.id)
                          : paths.dashboard.role.search
                      }
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
                        color={selectedRoleInfo.active ? 'success' : 'default'}
                        label={selectedRoleInfo.active ? 'فعال' : 'غیرفعال'}
                      />
                    </Stack>
                  )}
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: (theme) => `1px solid ${theme.palette.success.main}`,
                    boxShadow: (theme) => `0 8px 24px ${theme.palette.success.main}1F`,
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        مدارک جدید
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        برای هر مدرک یک عنوان و فایل انتخاب کنید.
                      </Typography>
                    </Box>
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
                                placeholder="مثل national_card"
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
              </Paper>

              <Stack
                direction="row"
                spacing={2}
                justifyContent="flex-end"
                sx={{ pt: 1, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}
              >
                <Button variant="outlined" onClick={() => router.back()}>
                  انصراف
                </Button>
                <Button type="submit" variant="contained" loading={isSubmitting}>
                  ثبت
                </Button>
              </Stack>
            </Stack>
          </Form>
        </CardContent>
      </Card>
    </Container>
  );
}
