'use client';

import { z as zod } from 'zod';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Container,
  Divider,
  Stack,
  TextField,
  Chip,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

import Autocomplete from '@mui/material/Autocomplete';

import { Form, Field } from 'src/components/hook-form';
import { paths } from 'src/routes/paths';

import {
  updateRole,
  listPermissions,
} from 'src/app/dashboard/_lib/access-control-mock';

const RoleSchema = zod.object({
  title: zod.string().min(1),
  slug: zod.string().min(1),
  description: zod.string().optional(),
  active: zod.boolean(),
  content: zod.string().optional(),
  permission_ids: zod.array(zod.number()).optional(),
});

/**
 * @param {{ role: object, readOnly?: boolean }} props
 */
export default function EditRoleView({ role, readOnly }) {
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

  const { handleSubmit, reset, watch, control, formState: { isSubmitting } } = methods;
  const selectedIds = watch('permission_ids') || [];

  useEffect(() => {
    if (!role) return;
    reset({
      title: role.title,
      slug: role.slug,
      description: role.description ?? '',
      active: role.active,
      content: role.content ?? '{}',
      permission_ids: role.permission_ids || [],
    });
  }, [role, reset]);

  const selectedRows = useMemo(
    () => permissionOptions.filter((p) => selectedIds.includes(p.id)),
    [permissionOptions, selectedIds]
  );

  const onSubmit = handleSubmit(async (data) => {
    if (readOnly) return;
    try {
      setErrorMessage(null);
      updateRole(role.id, {
        ...data,
        permission_ids: data.permission_ids || [],
      });
      router.push(paths.dashboard.role.search);
    } catch {
      setErrorMessage('خطا در ذخیره');
    }
  });

  return (
    <Container maxWidth="lg">
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            {readOnly ? 'جزئیات نقش' : 'ویرایش نقش'}
          </Typography>
          {readOnly && role && (
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
              <Chip size="small" label={`شناسه: ${role.id}`} />
              <Chip
                size="small"
                color={role.active ? 'success' : 'default'}
                label={role.active ? 'فعال' : 'غیرفعال'}
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
                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                  <Field.Text
                    name="content"
                    label="Content"
                    multiline
                    rows={3}
                    disabled={readOnly}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Field.Switch name="active" label="فعال" disabled={readOnly} />
                </Box>
                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                  <Typography fontWeight={600} sx={{ mb: 1 }}>
                    دسترسی‌های نقش
                  </Typography>
                  <Controller
                    name="permission_ids"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        disabled={readOnly}
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

              <Box>
                <Typography fontWeight={600} sx={{ mb: 1 }}>
                  جدول دسترسی‌های انتخاب‌شده
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>عنوان</TableCell>
                        <TableCell>اسلاگ</TableCell>
                        <TableCell>نوع</TableCell>
                        <TableCell>فعال</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <Typography variant="body2" color="text.secondary">
                              دسترسی انتخاب نشده است.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                      {selectedRows.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.title}</TableCell>
                          <TableCell>{p.slug}</TableCell>
                          <TableCell>{p.permission_type}</TableCell>
                          <TableCell>{p.active ? 'بله' : 'خیر'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => router.push(paths.dashboard.role.search)}>
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
