'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  MenuItem,
  Alert,
  Container,
  Divider,
  Stack,
} from '@mui/material';

import { Form, Field } from 'src/components/hook-form';
import { paths } from 'src/routes/paths';

import {
  PERMISSION_TYPES,
  createPermission,
} from 'src/app/dashboard/_lib/access-control-mock';

const PermissionSchema = zod.object({
  title: zod.string().min(1, 'عنوان الزامی است'),
  slug: zod.string().min(1, 'اسلاگ الزامی است'),
  description: zod.string().optional(),
  permission_type: zod.enum(['API', 'UI', 'SERVICE', 'PROCESS']),
  active: zod.boolean(),
  content_str: zod.string().optional(),
  content: zod.string().optional(),
  processes_raw: zod.string().optional(),
});

function parseProcesses(raw) {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(/[,،\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

export default function CreatePermissionPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(null);

  const methods = useForm({
    resolver: zodResolver(PermissionSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      permission_type: 'UI',
      active: true,
      content_str: '',
      content: '0',
      processes_raw: '',
    },
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);
      createPermission({
        ...data,
        content: data.content,
        processes: parseProcesses(data.processes_raw),
      });
      router.push(paths.dashboard.permission.search);
    } catch {
      setErrorMessage('خطا در ثبت دسترسی');
    }
  });

  return (
    <Container maxWidth="md">
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            دسترسی جدید
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            فیلدها مطابق مدل Permission در بک‌اند هستند.
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
                <Box>
                  <Field.Select name="permission_type" label="نوع دسترسی">
                    {PERMISSION_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Field.Switch name="active" label="فعال" />
                </Box>
                <Box>
                  <Field.Text name="content_str" label="Content (رشته)" />
                </Box>
                <Box>
                  <Field.Text name="content" label="Content (عدد)" />
                </Box>
                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                  <Field.Text
                    name="processes_raw"
                    label="شناسه فرایندها (با ویرگول)"
                    placeholder="مثال: 1, 2, 5"
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
