'use client';

import { z as zod } from 'zod';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
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
// ZOD
// --------------------------------------
export const BranchSchema = zod.object({
  title: zod.string().min(1),
  province: zod.string().min(1),
  city: zod.string().min(1),
  ip: zod.string().optional(),
  phone: zod.string().optional(),
  address: zod.string().optional(),
  description: zod.string().optional(),
  max_users: zod.string().min(1),
  is_active: zod.boolean(),
  services: zod.array(zod.string()).optional(),
});

// --------------------------------------

const CreateBranch = () => {
  const [errorMessage, setErrorMessage] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);

  // 👇 خدمات
  const servicesList = [
    { id: 1, name: 'خدمت شماره 1' },
    { id: 2, name: 'خدمت شماره 2' },
    { id: 3, name: 'خدمت شماره 3' },
    { id: 4, name: 'خدمت شماره 4' },
    { id: 5, name: 'پشتیبانی فنی' },
    { id: 6, name: 'مشاوره' },
  ];

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
      title: '',
      province: '',
      city: '',
      ip: '',
      description: '',
      address: '',
      phone: '',
      is_active: false,
      max_users: '',
      services: [],
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

  useEffect(() => {
    (async () => {
      const res = await fetchProvinces();
      setProvinces(res);
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
      const payload = {
        ...data,
        province: Number(data.province),
        city: Number(data.city),
        max_users: Number(data.max_users),
      };
      console.log(payload);
    } catch {
      setErrorMessage('خطا در ثبت اطلاعات');
    }
  });

  return (
    <Container maxWidth="lg">
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            اطلاعات شعبه
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            لطفاً اطلاعات خواسته‌شده را تکمیل کنید
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {!!errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Form methods={methods} onSubmit={onSubmit}>
            <Stack spacing={4}>
              {/* ================= PERSONAL ================= */}
              <Box>
                <Typography fontWeight={600} sx={{ mb: 2 }}>
                  اطلاعات شخصی
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Field.Text name="title" label="نام" />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Field.Text name="ip" label="نام خانوادگی" />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Field.Text name="max_users" label="کد ملی" />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* ================= LOCATION ================= */}
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Field.Text name="phone" label="شماره تلفن" />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Field.Select name="province" label="استان" placeholder="انتخاب استان">
                      {provinces.map((p) => (
                        <MenuItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Grid>

                  <Grid item xs={12} md={4}>
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
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* ================= SERVICES (SEARCH MULTI SELECT) ================= */}
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
                      getOptionLabel={(option) => option.name}
                      value={servicesList.filter((s) => field.value?.includes(String(s.id)))}
                      onChange={(_, value) => {
                        field.onChange(value.map((v) => String(v.id)));
                      }}
                      filterSelectedOptions
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="جستجو و انتخاب خدمات"
                          placeholder="مثلاً پشتیبانی..."
                        />
                      )}
                    />
                  )}
                />
              </Box>

              <Divider />

              {/* ================= BANK ================= */}
              <Box
                sx={{
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                }}
              >
                <Typography fontWeight={600} sx={{ mb: 2 }}>
                  حساب بانکی
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Field.Text name="address" label="شماره کارت" />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field.Text name="description" label="شماره شبا" />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* ================= ADDRESS ================= */}
              <Box>
                <Field.Text name="description" label="نشانی شعبه" multiline rows={4} />
              </Box>

              {/* ================= SUBMIT ================= */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                loading={isSubmitting}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                }}
              >
                ثبت اطلاعات
              </Button>
            </Stack>
          </Form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CreateBranch;
