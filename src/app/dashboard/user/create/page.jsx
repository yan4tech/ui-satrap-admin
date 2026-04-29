'use client';

import { z as zod } from 'zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  createUser,
  fetchRolesOptions,
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

  return (
    <Container maxWidth={false} disableGutters sx={{ mr: 0 }}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            کاربر جدید
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {!!errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Form methods={methods} onSubmit={onSubmit}>
            <Stack spacing={3}>
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
                    </Stack>
                  </Box>
                </Box>
              </Stack>

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
                              placeholder="مثل national_card"
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

              <Stack direction="row" spacing={2} justifyContent="flex-end">
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
