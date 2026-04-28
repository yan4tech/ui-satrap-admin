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
  API_METHODS,
  createPermission,
} from 'src/app/dashboard/_lib/access-control-mock';

const PermissionSchema = zod
  .object({
    title: zod.string().min(1, 'عنوان الزامی است'),
    slug: zod.string().min(1, 'اسلاگ الزامی است'),
    description: zod.string().optional(),
    permission_type: zod.enum(['API', 'UI', 'SERVICE', 'PROCESS']),
    active: zod.boolean(),
    api_path: zod.string().optional(),
    api_method: zod.string().optional(),
    process: zod.coerce.number().int().min(0, 'فرایند باید عدد صحیح مثبت باشد'),
  })
  .superRefine((data, ctx) => {
    if (data.permission_type !== 'API') return;
    if (!String(data.api_path ?? '').trim()) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ['api_path'],
        message: 'برای نوع API مسیر سرویس الزامی است',
      });
    }
    if (!API_METHODS.includes(String(data.api_method ?? ''))) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ['api_method'],
        message: 'متد API باید یکی از پروتکل‌های معتبر باشد',
      });
    }
  });

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
      api_path: '',
      api_method: '',
      process: 0,
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;
  const selectedPermissionType = watch('permission_type');
  const isActive = watch('active');

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);
      createPermission(data);
      router.push(paths.dashboard.permission.search);
    } catch {
      setErrorMessage('خطا در ثبت دسترسی');
    }
  });

  return (
    <Container maxWidth={false} disableGutters sx={{ mr: 0 }}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            دسترسی جدید
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
                {selectedPermissionType === 'UI' && (
                  <Box>
                    <Field.Text name="slug" label="اسلاگ" />
                  </Box>
                )}
                <Box>
                  <Typography sx={{ mb: 1 }} variant="body2">
                    وضعیت
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      color="success"
                      variant={isActive ? 'contained' : 'outlined'}
                      onClick={() => setValue('active', true)}
                    >
                      فعال
                    </Button>
                    <Button
                      size="small"
                      color="inherit"
                      variant={!isActive ? 'contained' : 'outlined'}
                      onClick={() => setValue('active', false)}
                    >
                      غیرفعال
                    </Button>
                  </Stack>
                </Box>
                {selectedPermissionType === 'API' && (
                  <>
                    <Box>
                      <Field.Text name="api_path" label="ApiPath" placeholder="/api/example" />
                    </Box>
                    <Box>
                      <Field.Select name="api_method" label="ApiMethod">
                        {API_METHODS.map((method) => (
                          <MenuItem key={method} value={method}>
                            {method}
                          </MenuItem>
                        ))}
                      </Field.Select>
                    </Box>
                  </>
                )}
                {selectedPermissionType === 'SERVICE' && (
                  <Box>
                    <Field.Text name="process" label="Process" type="number" />
                  </Box>
                )}
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
