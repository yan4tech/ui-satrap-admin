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
  updatePermission,
} from 'src/app/dashboard/_lib/access-control-mock';

const PermissionSchema = zod.object({
  title: zod.string().min(1),
  slug: zod.string().min(1),
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
      content_str: '',
      content: '0',
      processes_raw: '',
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  useEffect(() => {
    if (!permission) return;
    reset({
      title: permission.title,
      slug: permission.slug,
      description: permission.description ?? '',
      permission_type: permission.permission_type,
      active: permission.active,
      content_str: permission.content_str ?? '',
      content: String(permission.content ?? 0),
      processes_raw: (permission.processes || []).join(', '),
    });
  }, [permission, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (readOnly) return;
    try {
      setErrorMessage(null);
      updatePermission(permission.id, {
        ...data,
        content: data.content,
        processes: parseProcesses(data.processes_raw),
      });
      router.push(paths.dashboard.permission.search);
    } catch {
      setErrorMessage('خطا در ذخیره');
    }
  });

  return (
    <Container maxWidth="md">
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
                  <Field.Text name="slug" label="اسلاگ" disabled={readOnly} />
                </Box>
                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Field.Switch name="active" label="فعال" disabled={readOnly} />
                </Box>
                <Box>
                  <Field.Text name="content_str" label="Content (رشته)" disabled={readOnly} />
                </Box>
                <Box>
                  <Field.Text name="content" label="Content (عدد)" disabled={readOnly} />
                </Box>
                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                  <Field.Text
                    name="processes_raw"
                    label="شناسه فرایندها"
                    disabled={readOnly}
                  />
                </Box>
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
