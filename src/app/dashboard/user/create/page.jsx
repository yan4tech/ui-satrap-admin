'use client';

import { z as zod } from 'zod';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  MenuItem,
  Alert,
  Container,
  Divider,
  Stack,
} from '@mui/material';

import { Form, Field } from 'src/components/hook-form';
import { paths } from 'src/routes/paths';

import {
  createUser,
  listRoles,
  mockBranches,
  USER_TYPE_OPTIONS,
} from 'src/app/dashboard/_lib/access-control-mock';

const UserSchema = zod.object({
  name: zod.string().min(1),
  family: zod.string().min(1),
  email: zod.union([zod.string().email(), zod.literal('')]),
  mobile: zod.string().min(10, 'موبایل معتبر وارد کنید'),
  role_id: zod.number().min(1, 'نقش را انتخاب کنید'),
  branch_id: zod.number().min(1, 'شعبه را انتخاب کنید'),
  user_type: zod.number(),
  active: zod.boolean(),
  verified: zod.boolean(),
});

export default function CreateUserPage() {
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
      role_id: roles[0]?.id ?? 0,
      branch_id: mockBranches[0]?.id ?? 0,
      user_type: 3,
      active: true,
      verified: false,
    },
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);
      createUser({
        ...data,
        email: data.email || '',
      });
      router.push(paths.dashboard.user.search);
    } catch {
      setErrorMessage('خطا در ثبت کاربر');
    }
  });

  return (
    <Container maxWidth="md">
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            کاربر جدید
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            نقش و شعبه مطابق مدل User در بک‌اند است.
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {!!errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Form methods={methods} onSubmit={onSubmit}>
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Field.Text name="name" label="نام" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field.Text name="family" label="نام خانوادگی" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field.Text name="mobile" label="موبایل" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field.Text name="email" label="ایمیل" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field.Select name="role_id" label="نقش (Role)">
                    {roles.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.title}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field.Select name="branch_id" label="شعبه">
                    {mockBranches.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.title}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field.Select name="user_type" label="نوع کاربر">
                    {USER_TYPE_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Grid>
                <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Field.Switch name="active" label="فعال" />
                </Grid>
                <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Field.Switch name="verified" label="تأیید شده" />
                </Grid>
              </Grid>

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
