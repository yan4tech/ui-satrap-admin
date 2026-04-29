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
  Paper,
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
  const sectionSx = {
    borderRadius: 2.5,
    p: { xs: 2, md: 3 },
    borderColor: 'divider',
    backgroundColor: 'background.neutral',
  };

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
                  دسترسی جدید
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  نوع دسترسی را انتخاب کنید و فیلدهای مربوط را تکمیل کنید.
                </Typography>
              </Box>
              <Chip
                label="فرم دسترسی"
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
                  اطلاعات دسترسی
                </Typography>
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
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                        columnGap: 3,
                        rowGap: 2,
                      }}
                    >
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
                    </Box>
                  {selectedPermissionType === 'UI' && (
                    <Box>
                      <Field.Text name="slug" label="اسلاگ" />
                    </Box>
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
