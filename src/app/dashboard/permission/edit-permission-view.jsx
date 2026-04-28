'use client';

import { z as zod } from 'zod';
import { useEffect, useState } from 'react';
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
  updatePermission,
} from 'src/app/dashboard/_lib/access-control-mock';

const PermissionSchema = zod
  .object({
    title: zod.string().min(1),
    slug: zod.string().min(1),
    description: zod.string().optional(),
    permission_type: zod.enum(['API', 'UI', 'SERVICE', 'PROCESS']),
    active: zod.boolean(),
    api_path: zod.string().optional(),
    api_method: zod.string().optional(),
    process: zod.coerce.number().int().min(0),
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
        message: 'متد API باید معتبر باشد',
      });
    }
  });

/**
 * @param {{ permission: object, readOnly?: boolean }} props
 */
export default function EditPermissionView({ permission, readOnly }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(null);

  const methods = useForm({
    resolver: zodResolver(PermissionSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      permission_type: 'UI',
      active: false,
      api_path: '',
      api_method: '',
      process: 0,
    },
  });

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;
  const selectedPermissionType = watch('permission_type');
  const isActive = watch('active');

  useEffect(() => {
    if (!permission) return;
    reset({
      title: permission.title,
      slug: permission.slug,
      description: permission.description ?? '',
      permission_type: permission.permission_type,
      active: permission.active,
      api_path: permission.api_path ?? '',
      api_method: permission.api_method ?? '',
      process: Number(permission.process ?? 0),
    });
  }, [permission, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (readOnly) return;
    try {
      setErrorMessage(null);
      updatePermission(permission.id, data);
      router.push(paths.dashboard.permission.search);
    } catch {
      setErrorMessage('خطا در ذخیره');
    }
  });

  return (
    <Container maxWidth={false} disableGutters sx={{ mr: 0 }}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            {readOnly ? 'جزئیات دسترسی' : 'ویرایش دسترسی'}
          </Typography>
          {!readOnly && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              شناسه: {permission?.id}
            </Typography>
          )}
          {readOnly && permission && (
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
              <Chip size="small" label={`شناسه: ${permission.id}`} />
              <Chip size="small" label={`نوع: ${permission.permission_type}`} />
              <Chip
                size="small"
                color={permission.active ? 'success' : 'default'}
                label={permission.active ? 'فعال' : 'غیرفعال'}
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
                  <Field.Text name="title" label="عنوان" disabled={readOnly} />
                </Box>
                <Box>
                  <Field.Text
                    name="description"
                    label="توضیحات"
                    multiline
                    rows={2}
                    disabled={readOnly}
                  />
                </Box>
                <Box>
                  <Field.Select name="permission_type" label="نوع دسترسی" disabled={readOnly}>
                    {PERMISSION_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Box>
                {selectedPermissionType === 'UI' && (
                  <Box>
                    <Field.Text name="slug" label="اسلاگ" disabled={readOnly} />
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
                      disabled={readOnly}
                      variant={isActive ? 'contained' : 'outlined'}
                      onClick={() => setValue('active', true)}
                    >
                      فعال
                    </Button>
                    <Button
                      size="small"
                      color="inherit"
                      disabled={readOnly}
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
                      <Field.Text name="api_path" label="ApiPath" disabled={readOnly} />
                    </Box>
                    <Box>
                      <Field.Select name="api_method" label="ApiMethod" disabled={readOnly}>
                        {API_METHODS.map((method) => (
                          <MenuItem key={method} value={method}>
                            {method}
                          </MenuItem>
                        ))}
                      </Field.Select>
                    </Box>
                  </>
                )}
                {(selectedPermissionType === 'SERVICE' || selectedPermissionType === 'PROCESS') && (
                  <Box>
                    <Field.Text
                      name="process"
                      label="شناسه خدمت (Process)"
                      type="number"
                      disabled={readOnly}
                    />
                  </Box>
                )}
              </Box>

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => router.push(paths.dashboard.permission.search)}>
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
