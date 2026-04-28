'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z as zod } from 'zod';

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
  TextField,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';

import Autocomplete from '@mui/material/Autocomplete';

import { Form, Field } from 'src/components/hook-form';
import axios from 'src/lib/axios';

// --------------------------------------
// ZOD SCHEMA
// --------------------------------------
export const BranchSchema = zod.object({
  title: zod.string().trim().min(1, 'عنوان شعبه الزامی است'),
  province: zod.string().trim().min(1, 'استان الزامی است'),
  city: zod.string().trim().min(1, 'شهر الزامی است'),
  ip: zod
    .string()
    .trim()
    .min(1, 'IP الزامی است')
    .regex(
      /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
      'فرمت IP معتبر نیست'
    ),
  phone: zod.string().trim().min(1, 'شماره تلفن الزامی است'),
  address: zod.string().trim().min(1, 'نشانی شعبه الزامی است'),
  description: zod.string().optional(),
  max_users: zod
    .coerce
    .number({
      invalid_type_error: 'تعداد کاربران باید عدد باشد',
      required_error: 'تعداد کاربران مجاز الزامی است',
    })
    .int('تعداد کاربران باید عدد صحیح باشد')
    .min(1, 'تعداد کاربران باید حداقل 1 باشد'),
  is_active: zod.boolean(),
  permissions: zod.array(zod.number()).min(1, 'حداقل یک خدمت باید انتخاب شود'),
});

// --------------------------------------
// COMPONENT
// --------------------------------------
export default function EditBranch({ branchData }) {
  const [errorMessage, setErrorMessage] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]);

  // fake APIs
  const fetchProvinces = async () => [
    { id: 1, name: 'تهران' },
    { id: 2, name: 'اصفهان' },
  ];

  const fetchCitiesByProvince = async (provinceId) => {
    const data = {
      1: [
        { id: 10, name: 'تهران' },
        { id: 11, name: 'اسلامشهر' },
      ],
      2: [
        { id: 20, name: 'اصفهان' },
        { id: 21, name: 'کاشان' },
      ],
    };
    return data[provinceId] || [];
  };

  const methods = useForm({
    resolver: zodResolver(BranchSchema),
    defaultValues: {
      title: branchData?.title || '',
      province: String(branchData?.province || ''),
      city: String(branchData?.city || ''),
      ip: branchData?.ip || '',
      phone: branchData?.phone || '',
      address: branchData?.address || '',
      description: branchData?.description || '',
      max_users: branchData?.max_users || '',
      is_active: branchData?.is_active || false,
      permissions: branchData?.permissions?.map((p) => p?.ID ?? p?.id).filter(Boolean) || [],
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { isSubmitting },
  } = methods;

  const selectedProvince = watch('province');

  // load provinces
  useEffect(() => {
    (async () => {
      const res = await fetchProvinces();
      setProvinces(res);
    })();
  }, []);

  // load permissions/services options
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/membership/ac/permission?permission_type=PROCESS', {
          headers: { mode: 'company' },
        });
        const options = (res?.data?.data || []).map((item) => ({
          id: item.ID,
          title: item.title,
        }));
        setPermissionsList(options);
      } catch {
        setPermissionsList([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedProvince) return;

    (async () => {
      const res = await fetchCitiesByProvince(selectedProvince);
      setCities(res);
      setValue('city', '');
    })();
  }, [selectedProvince, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const branchId = Number(branchData?.ID ?? branchData?.id);

      if (!branchId) {
        setErrorMessage('شناسه شعبه معتبر نیست');
        return;
      }

      const payload = {
        title: data.title,
        province: Number(data.province),
        city: Number(data.city),
        ip: data.ip,
        phone: data.phone,
        address: data.address,
        description: data.description || '',
        is_active: data.is_active,
        max_users: Number(data.max_users),
        permissions: data.permissions,
      };

      await axios.put(`/api/membership/branch/${branchId}`, payload);
      setErrorMessage(null);
    } catch {
      setErrorMessage('خطا در ویرایش اطلاعات');
    }
  });

  return (
    <Container maxWidth={false} disableGutters sx={{ mr: 0 }}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700}>
            ویرایش شعبه
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            اطلاعات را ویرایش کنید
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {!!errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Form methods={methods} onSubmit={onSubmit}>
            <Stack spacing={4}>
              {/* BASIC */}
              <Box>
                <Typography fontWeight={600} sx={{ mb: 2 }}>
                  اطلاعات پایه شعبه
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
                    <Field.Text name="title" label="عنوان شعبه" />
                  </Box>

                  <Box>
                    <Field.Text name="ip" label="IP" />
                  </Box>

                  <Box>
                    <Field.Text name="max_users" label="تعداد کاربران مجاز شعبه" type="number" />
                  </Box>
                  <Box>
                    <Field.Text name="phone" label="شماره تلفن" />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                    <Controller
                      name="is_active"
                      control={control}
                      render={({ field }) => (
                        <FormControl
                          sx={{
                            width: '100%',
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{ mb: 1.5, textAlign: 'right' }}
                          >
                            وضعیت شعبه
                          </Typography>
                          <RadioGroup
                            row
                            value={field.value ? 'true' : 'false'}
                            onChange={(event) => field.onChange(event.target.value === 'true')}
                            sx={{ direction: 'rtl', gap: 3 }}
                          >
                            <FormControlLabel
                              value="true"
                              control={<Radio size="medium" sx={{ transform: 'scale(1.2)' }} />}
                              label="فعال"
                              sx={{
                                '.MuiFormControlLabel-label': { fontSize: 18, fontWeight: 600 },
                              }}
                            />
                            <FormControlLabel
                              value="false"
                              control={<Radio size="medium" sx={{ transform: 'scale(1.2)' }} />}
                              label="غیرفعال"
                              sx={{
                                '.MuiFormControlLabel-label': { fontSize: 18, fontWeight: 600 },
                              }}
                            />
                          </RadioGroup>
                        </FormControl>
                      )}
                    />
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* LOCATION */}
              <Box>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                    columnGap: 3,
                    rowGap: 2,
                  }}
                >
                  <Box>
                    <Field.Select name="province" label="استان" placeholder="انتخاب استان">
                      {provinces.map((p) => (
                        <MenuItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Box>

                  <Box>
                    <Field.Select
                      name="city"
                      label="شهر"
                      disabled={!selectedProvince}
                      placeholder="انتخاب شهر"
                    >
                      {cities.map((c) => (
                        <MenuItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* SERVICES */}
              <Box>
                <Typography fontWeight={600} sx={{ mb: 2 }}>
                  انتخاب خدمات
                </Typography>

                <Controller
                  name="permissions"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      options={permissionsList}
                      getOptionLabel={(o) => o.title}
                      value={permissionsList.filter((s) => field.value?.includes(s.id))}
                      onChange={(_, value) => field.onChange(value.map((v) => v.id))}
                      filterSelectedOptions
                      renderInput={(params) => (
                        <TextField {...params} label="جستجو و انتخاب خدمات" placeholder="خدمت..." />
                      )}
                    />
                  )}
                />
              </Box>

              <Divider />

              {/* ADDRESS */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  columnGap: 3,
                  rowGap: 2,
                }}
              >
                <Box>
                  <Field.Text name="address" label="نشانی شعبه" multiline rows={3} />
                </Box>
                <Box>
                  <Field.Text name="description" label="توضیحات" multiline rows={3} />
                </Box>
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                loading={isSubmitting}
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                ذخیره تغییرات
              </Button>
            </Stack>
          </Form>
        </CardContent>
      </Card>
    </Container>
  );
}
