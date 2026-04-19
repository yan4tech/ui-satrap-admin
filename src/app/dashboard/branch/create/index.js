'use client';

import { z as zod } from 'zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Box, Button, Card, CardContent, Typography, Grid, MenuItem, Alert } from '@mui/material';

import { Form, Field } from 'src/components/hook-form';

// --------------------------------------
// ✅ ZOD SCHEMA
// --------------------------------------
export const BranchSchema = zod.object({
  title: zod.string().min(1, { message: 'عنوان الزامی است' }),
  province: zod.string().min(1, { message: 'استان الزامی است' }),
  city: zod.string().min(1, { message: 'شهر الزامی است' }),
  ip: zod.string().optional(),
  phone: zod.string().optional(),
  address: zod.string().optional(),
  description: zod.string().optional(),
  max_users: zod.string().min(1, { message: 'حداکثر کاربران الزامی است' }),
  is_active: zod.boolean(),
});

// --------------------------------------

const CreateBranch = () => {
  const [errorMessage, setErrorMessage] = useState(null);

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);

  // --------------------------------------
  // fake API
  // --------------------------------------
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

  // --------------------------------------
  // FORM
  // --------------------------------------
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
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const selectedProvince = watch('province');

  // --------------------------------------
  // load provinces
  // --------------------------------------
  useEffect(() => {
    const load = async () => {
      const res = await fetchProvinces();
      setProvinces(res);
    };
    load();
  }, []);

  // --------------------------------------
  // load cities when province changes
  // --------------------------------------
  useEffect(() => {
    if (!selectedProvince) return;

    const loadCities = async () => {
      const res = await fetchCitiesByProvince(selectedProvince);
      setCities(res);
      setValue('city', '');
    };

    loadCities();
  }, [selectedProvince, setValue]);

  // --------------------------------------
  // SUBMIT
  // --------------------------------------
  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        ...data,
        province: Number(data.province),
        city: Number(data.city),
        max_users: Number(data.max_users),
      };

      console.log('Submit Branch:', payload);
    } catch (error) {
      setErrorMessage('خطا در ثبت اطلاعات');
    }
  });

  // --------------------------------------
  // UI
  // --------------------------------------
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          ایجاد شعبه جدید
        </Typography>

        {!!errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Form methods={methods} onSubmit={onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Field.Text name="title" label="عنوان" />
              </Grid>

              <Grid item xs={12} md={6}>
                <Field.Text name="ip" label="IP" />
              </Grid>

              <Grid item xs={12} md={6}>
                <Field.Select name="province" label="استان">
                  {provinces.map((p) => (
                    <MenuItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>

              <Grid item xs={12} md={6}>
                <Field.Select name="city" label="شهر" disabled={!selectedProvince}>
                  {cities.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>

              <Grid item xs={12} md={6}>
                <Field.Text name="phone" label="تلفن" />
              </Grid>

              <Grid item xs={12} md={6}>
                <Field.Text name="max_users" label="حداکثر کاربران" type="number" />
              </Grid>

              <Grid item xs={12}>
                <Field.Text name="address" label="آدرس" />
              </Grid>

              <Grid item xs={12}>
                <Field.Text name="description" label="توضیحات" multiline rows={3} />
              </Grid>

              <Grid item xs={12}>
                <Field.Switch name="is_active" label="فعال / غیرفعال" />
              </Grid>

              <Grid item xs={12}>
                <Button fullWidth type="submit" variant="contained" loading={isSubmitting}>
                  ثبت شعبه
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateBranch;
