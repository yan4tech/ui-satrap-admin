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
  Chip,
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
    slug: zod.string().optional(),
    description: zod.string().optional(),
    permission_type: zod.enum(['API', 'UI', 'SERVICE', 'PROCESS']),
    active: zod.boolean(),
    api_path: zod.string().optional(),
    api_method: zod.string().optional(),
    process: zod.coerce.number().int().min(0, 'فرایند باید عدد صحیح مثبت باشد'),
  })
  .superRefine((data, ctx) => {
    if (data.permission_type === 'UI' && !String(data.slug ?? '').trim()) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ['slug'],
        message: 'برای نوع UI اسلاگ الزامی است',
      });
    }
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
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" sx={{ mb: 1 }}>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                دسترسی جدید
              </Typography>
              <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 0.5 }}>
                اطلاعات دسترسی را کامل کنید و سپس ثبت کنید.
              </Typography>
            </Box>
          </Stack>

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
                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
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
                      color="error"
                      variant={!isActive ? 'contained' : 'outlined'}
                      onClick={() => setValue('active', false)}
                    >
                      غیرفعال
                    </Button>
                  </Stack>
                </Box>
                {selectedPermissionType === 'API' && (
                  <Box
                    sx={{
                      gridColumn: { xs: 'span 1', md: 'span 2' },
                      p: 2,
                      borderRadius: 2,
                      border: '1px dashed',
                      borderColor: 'info.main',
                      bgcolor: 'info.lighter',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                      تنظیمات API
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                        columnGap: 2,
                        rowGap: 2,
                      }}
                    >
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
                    </Box>
                  </Box>
                )}
                {(selectedPermissionType === 'SERVICE' || selectedPermissionType === 'PROCESS') && (
                  <Box
                    sx={{
                      gridColumn: { xs: 'span 1', md: 'span 2' },
                      p: 2,
                      borderRadius: 2,
                      border: '1px dashed',
                      borderColor: 'warning.main',
                      bgcolor: 'warning.lighter',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                      شناسه خدمت
                    </Typography>
                    <Field.Text name="process" label="شناسه خدمت (Process)" type="number" />
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
