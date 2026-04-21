'use client';

import { z as zod } from 'zod';
import { useEffect, useMemo, useState } from 'react';
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
} from '@mui/material';

import { Form, Field } from 'src/components/hook-form';
import { paths } from 'src/routes/paths';

import {
  updateUser,
  listRoles,
  mockBranches,
  USER_TYPE_OPTIONS,
  roleTitleById,
  branchTitleById,
} from 'src/app/dashboard/_lib/access-control-mock';

const UserSchema = zod.object({
  name: zod.string().min(1),
  family: zod.string().min(1),
  email: zod.string().optional(),
  mobile: zod.string().min(10),
  role_id: zod.number().min(1),
  branch_id: zod.number().min(1),
  user_type: zod.number(),
  active: zod.boolean(),
  verified: zod.boolean(),
});

/**
 * @param {{ user: object, readOnly?: boolean }} props
 */
export default function EditUserView({ user, readOnly }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(null);
  const roles = useMemo(() => listRoles(), []);

  const methods = useForm({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      name: '',
      family: '',
      email: '',
      mobile: '',
      role_id: 1,
      branch_id: 1,
      user_type: 3,
      active: true,
      verified: false,
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  useEffect(() => {
    if (!user) return;
    reset({
      name: user.name,
      family: user.family,
      email: user.email ?? '',
      mobile: user.mobile,
      role_id: user.role_id || roles[0]?.id || 1,
      branch_id: user.branch_id || mockBranches[0]?.id || 1,
      user_type: user.user_type,
      active: user.active,
      verified: user.verified,
    });
  }, [user, reset, roles]);

  const onSubmit = handleSubmit(async (data) => {
    if (readOnly) return;
    try {
      setErrorMessage(null);
      updateUser(user.id, { ...data, email: data.email || '' });
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
              <Chip size="small" label={`شناسه: ${user.id}`} />
              <Chip size="small" label={`نقش: ${roleTitleById(user.role_id)}`} />
              <Chip size="small" label={`شعبه: ${branchTitleById(user.branch_id)}`} />
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
                <Box>
                  <Field.Select name="branch_id" label="شعبه" disabled={readOnly}>
                    {mockBranches.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.title}
                      </MenuItem>
                    ))}
                  </Field.Select>
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Field.Switch name="active" label="فعال" disabled={readOnly} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Field.Switch name="verified" label="تأیید شده" disabled={readOnly} />
                </Box>
              </Box>

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
