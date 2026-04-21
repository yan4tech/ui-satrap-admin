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
} from '@mui/material';

import Autocomplete from '@mui/material/Autocomplete';

import { Form, Field } from 'src/components/hook-form';

// --------------------------------------
// ZOD SCHEMA
// --------------------------------------
export const BranchSchema = zod.object({
  title: zod.string().min(1),
  province: zod.string().min(1),
  city: zod.string().min(1),
  village: zod.string().optional(),
  ip: zod.string().optional(),
  phone: zod.string().optional(),
  address: zod.string().optional(),
  description: zod.string().optional(),
  max_users: zod.string().min(1),
  is_active: zod.boolean(),
  services: zod.array(zod.string()).optional(),
});

// --------------------------------------
// COMPONENT
// --------------------------------------
export default function EditBranch({ branchData }) {
  const [errorMessage, setErrorMessage] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [villages, setVillages] = useState([]);

  const servicesList = [
    { id: 1, name: 'خدمت شماره 1' },
    { id: 2, name: 'خدمت شماره 2' },
    { id: 3, name: 'خدمت شماره 3' },
    { id: 4, name: 'خدمت شماره 4' },
    { id: 5, name: 'پشتیبانی فنی' },
    { id: 6, name: 'مشاوره' },
  ];

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

  const fetchVillagesByCity = async (cityId) => {
    const data = {
      10: [
        { id: 100, name: 'روستای A' },
        { id: 101, name: 'روستای B' },
      ],
      20: [
        { id: 200, name: 'روستای C' },
        { id: 201, name: 'روستای D' },
      ],
    };
    return data[cityId] || [];
  };

  const methods = useForm({
    resolver: zodResolver(BranchSchema),
    defaultValues: {
      title: branchData?.title || '',
      province: branchData?.province || '',
      city: branchData?.city || '',
      village: branchData?.village || '',
      ip: branchData?.ip || '',
      phone: branchData?.phone || '',
      address: branchData?.address || '',
      description: branchData?.description || '',
      max_users: branchData?.max_users || '',
      is_active: branchData?.is_active || false,
      services: branchData?.services || [],
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
  const selectedCity = watch('city');

  // load provinces
  useEffect(() => {
    (async () => {
      const res = await fetchProvinces();
      setProvinces(res);
    })();
  }, []);

  // load cities
  useEffect(() => {
    if (!selectedProvince) return;

    (async () => {
      const res = await fetchCitiesByProvince(selectedProvince);
      setCities(res);
      setValue('city', '');
      setValue('village', '');
    })();
  }, [selectedProvince, setValue]);

  // load villages
  useEffect(() => {
    if (!selectedCity) {
      setVillages([]);
      setValue('village', '');
      return;
    }

    (async () => {
      const res = await fetchVillagesByCity(selectedCity);
      setVillages(res);
      setValue('village', '');
    })();
  }, [selectedCity, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      console.log(data);
    } catch {
      setErrorMessage('خطا در ویرایش اطلاعات');
    }
  });

  return (
    <Container maxWidth="lg">
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
              {/* PERSONAL */}
              <Box>
                <Typography fontWeight={600} sx={{ mb: 2 }}>
                  اطلاعات شخصی
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
                    <Field.Text name="title" label="نام" />
                  </Box>

                  <Box>
                    <Field.Text name="ip" label="نام خانوادگی" />
                  </Box>

                  <Box>
                    <Field.Text name="max_users" label="کد ملی" />
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
                    <Field.Text name="phone" label="شماره تلفن" />
                  </Box>

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

                  <Box>
                    <Field.Select
                      name="village"
                      label="روستا"
                      disabled={!selectedCity}
                      placeholder="انتخاب روستاه/ده"
                    >
                      {villages.map((v) => (
                        <MenuItem key={v.id} value={String(v.id)}>
                          {v.name}
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
                  خدمات قابل ارائه
                </Typography>

                <Controller
                  name="services"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      options={servicesList}
                      getOptionLabel={(o) => o.name}
                      value={servicesList.filter((s) => field.value?.includes(String(s.id)))}
                      onChange={(_, value) => field.onChange(value.map((v) => String(v.id)))}
                      renderInput={(params) => (
                        <TextField {...params} label="جستجو خدمات" placeholder="خدمت..." />
                      )}
                    />
                  )}
                />
              </Box>

              <Divider />

              {/* BANK */}
              <Box>
                <Typography fontWeight={600} sx={{ mb: 2 }}>
                  حساب بانکی
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
                    <Field.Text name="address" label="شماره کارت" />
                  </Box>

                  <Box>
                    <Field.Text name="description" label="شماره شبا" />
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* ADDRESS */}
              <Field.Text name="description" label="نشانی شعبه" multiline rows={4} />

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
