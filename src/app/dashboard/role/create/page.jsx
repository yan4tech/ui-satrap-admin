'use client';

import { z as zod } from 'zod';
import { useEffect, useState } from 'react';
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
  Paper,
  Chip,
} from '@mui/material';

import Autocomplete from '@mui/material/Autocomplete';

import { Form, Field } from 'src/components/hook-form';
import { paths } from 'src/routes/paths';
import axios from 'src/lib/axios';

const RoleSchema = zod.object({
  title: zod.string().min(1),
  slug: zod.string().min(1),
  description: zod.string().optional(),
  active: zod.boolean(),
  content: zod.string().optional(),
  permission_ids: zod.array(zod.number()).optional(),
});

const normalizePermissionIds = (ids) =>
  (Array.isArray(ids) ? ids : [])
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id));

export default function CreateRolePage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [permissionOptions, setPermissionOptions] = useState([]);
  const [permissionLoading, setPermissionLoading] = useState(false);

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

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;
  const isActive = watch('active');
  const sectionSx = {
    borderRadius: 2.5,
    p: { xs: 2, md: 3 },
    borderColor: 'divider',
    backgroundColor: 'background.neutral',
  };

  useEffect(() => {
    let mounted = true;
    const fetchPermissions = async () => {
      setPermissionLoading(true);
      try {
        const limit = 100;
        let offset = 0;
        let all = [];
        let shouldContinue = true;

        while (shouldContinue) {
          const res = await axios.get('/api/membership/ac/permission', {
            headers: {
              mode: 'company',
              limit: String(limit),
              offset: String(offset),
            },
          });

          const payload = res?.data ?? {};
          const batch = Array.isArray(payload?.data) ? payload.data : [];
          all = all.concat(batch);

          if (batch.length < limit) {
            shouldContinue = false;
          } else {
            offset += limit;
          }
        }

        if (!mounted) return;
        setPermissionOptions(
          all.map((item) => ({
            id: Number(item?.ID ?? item?.id),
            title: item?.title ?? '',
            slug: item?.slug ?? '',
          }))
        );
      } catch (error) {
        if (!mounted) return;
        setPermissionOptions([]);
        setErrorMessage(error?.response?.data?.message || error?.response?.data?.error || 'خطا در دریافت لیست دسترسی‌ها');
      } finally {
        if (mounted) setPermissionLoading(false);
      }
    };

    fetchPermissions();
    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      const normalizedPermissionIds = normalizePermissionIds(data.permission_ids);

      await axios.post('/api/membership/ac/role', {
        title: data.title,
        slug: data.slug,
        description: data.description || '',
        active: data.active,
        content: data.content || '',
        permissions: normalizedPermissionIds,
      }, {
        headers: { mode: 'company' },
      });

      setSuccessMessage('نقش با موفقیت ثبت شد. در حال انتقال به لیست نقش‌ها...');
      setTimeout(() => {
        router.push(paths.dashboard.role.search);
      }, 900);
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.error || 'خطا در ثبت نقش';
      setErrorMessage('خطا در ثبت نقش');
      setSuccessMessage(null);
      if (message && message !== 'خطا در ثبت نقش') {
        setErrorMessage(message);
      }
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
                  نقش جدید
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  مشخصات نقش را ثبت کنید و دسترسی‌های مرتبط را انتخاب کنید.
                </Typography>
              </Box>
              <Chip
                label="فرم نقش"
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
          {!!successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          <Form methods={methods} onSubmit={onSubmit}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={sectionSx}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  اطلاعات نقش
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
                  <Box>
                    <Field.Text name="slug" label="اسلاگ" />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                    <Typography fontWeight={600} sx={{ mb: 1 }}>
                      دسترسی ها
                    </Typography>
                    <Controller
                      name="permission_ids"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          multiple
                          options={permissionOptions}
                          loading={permissionLoading}
                          getOptionLabel={(o) => `${o.title} (${o.slug})`}
                          isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
                          value={permissionOptions.filter((p) => field.value?.includes(p.id))}
                          onChange={(_, value) => field.onChange(normalizePermissionIds(value.map((v) => v.id)))}
                          filterSelectedOptions
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="انتخاب دسترسی‌ها"
                              placeholder="جستجو..."
                              helperText={permissionLoading ? 'در حال دریافت دسترسی‌ها...' : ''}
                            />
                          )}
                        />
                      )}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                    <Field.Text name="content" label="Content (JSON یا متن)" multiline rows={3} />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                    <Field.Text name="description" label="توضیحات" multiline rows={2} />
                  </Box>
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
