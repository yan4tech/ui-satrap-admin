'use client';

import { z as zod } from 'zod';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Container,
  Divider,
  Stack,
  TextField,
} from '@mui/material';

import Autocomplete from '@mui/material/Autocomplete';

import { Form, Field } from 'src/components/hook-form';
import { paths } from 'src/routes/paths';

import { createRole, listPermissions } from 'src/app/dashboard/_lib/access-control-mock';

const RoleSchema = zod.object({
  title: zod.string().min(1),
  slug: zod.string().min(1),
  description: zod.string().optional(),
  active: zod.boolean(),
  content: zod.string().optional(),
  permission_ids: zod.array(zod.number()).optional(),
});

export default function CreateRolePage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(null);
  const permissionOptions = useMemo(() => listPermissions(), []);

  const methods = useForm({
    resolver: zodResolver(RoleSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      active: true,
      content: '{}',
      permission_ids: [],
    },
  });

  const { handleSubmit, control, formState: { isSubmitting } } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);
      createRole({
        ...data,
        permission_ids: data.permission_ids || [],
      });
      router.push(paths.dashboard.role.search);
    } catch {
      setErrorMessage('خطا در ثبت نقش');
    }
  });

  return (
    <Container maxWidth="md">
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            نقش جدید
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            دسترسی‌های انتخاب‌شده در لیست نقش‌ها و جزئیات نقش هم نمایش داده می‌شوند.
          </Typography>
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
                  <Field.Text name="title" label="عنوان" />
                </Box>
                <Box>
                  <Field.Text name="slug" label="اسلاگ" />
                </Box>
                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                  <Field.Text name="description" label="توضیحات" multiline rows={2} />
                </Box>
                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                  <Field.Text name="content" label="Content (JSON یا متن)" multiline rows={3} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Field.Switch name="active" label="فعال" />
                </Box>
                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                  <Typography fontWeight={600} sx={{ mb: 1 }}>
                    دسترسی‌ها (Permission)
                  </Typography>
                  <Controller
                    name="permission_ids"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        options={permissionOptions}
                        getOptionLabel={(o) => `${o.title} (${o.slug})`}
                        value={permissionOptions.filter((p) => field.value?.includes(p.id))}
                        onChange={(_, value) => field.onChange(value.map((v) => v.id))}
                        filterSelectedOptions
                        renderInput={(params) => (
                          <TextField {...params} label="انتخاب دسترسی‌ها" placeholder="جستجو..." />
                        )}
                      />
                    )}
                  />
                </Box>
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
