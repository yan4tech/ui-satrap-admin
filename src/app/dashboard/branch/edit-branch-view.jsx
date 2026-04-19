'use client';

import { z as zod } from 'zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Box, Button, Card, CardContent, Typography, Grid, MenuItem, Alert } from '@mui/material';

import { Form, Field } from 'src/components/hook-form';

// --------------------------------------
// ✅ SCHEMA
// --------------------------------------
export const BranchSchema = zod.object({
  id: zod.number().optional(),
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

const EditBranchView = ({ branch, readOnly = false }) => {
  const [errorMessage, setErrorMessage] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [provinces] = useState([
    { id: 1, name: 'تهران' },
    { id: 2, name: 'اصفهان' },
  ]);

  const [cities, setCities] = useState([]);

  // --------------------------------------
  // fake API
  // --------------------------------------
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
      id: null,
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
    reset,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const selectedProvince = watch('province');

  // --------------------------------------
  // load branch into form
  // --------------------------------------
  useEffect(() => {
    const load = async () => {
      if (!branch) return;

      reset({
        id: branch.ID,
        title: branch.title || '',
        province: branch.province ? String(branch.province) : '',
        city: branch.city ? String(branch.city) : '',
        ip: branch.ip || '',
        description: branch.description || '',
        address: branch.address || '',
        phone: branch.phone || '',
        is_active: branch.is_active || false,
        max_users: branch.max_users ? String(branch.max_users) : '',
      });

      if (branch.province) {
        const cityList = await fetchCitiesByProvince(branch.province);
        setCities(cityList);
      }
    };

    load();
  }, [branch, reset]);

  // --------------------------------------
  // province change → load cities
  // --------------------------------------
  useEffect(() => {
    if (!selectedProvince) return;
    if (readOnly) return;

    const loadCities = async () => {
      const res = await fetchCitiesByProvince(selectedProvince);
      setCities(res);
      setValue('city', '');
    };

    loadCities();
  }, [selectedProvince, setValue, readOnly]);

  // --------------------------------------
  // SUBMIT
  // --------------------------------------
  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        ...data,
        id: data.id,
        province: Number(data.province),
        city: Number(data.city),
        max_users: Number(data.max_users),
        documents,
      };

      console.log('Update Branch:', payload);
    } catch (error) {
      setErrorMessage('خطا در ویرایش اطلاعات');
    }
  });

  // --------------------------------------
  // UI
  // --------------------------------------
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {readOnly ? 'جزئیات شعبه' : 'ویرایش شعبه'}
        </Typography>

        {!!errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Form methods={methods} onSubmit={readOnly ? (e) => e.preventDefault() : onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Field.Text name="title" label="عنوان" disabled={readOnly} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Field.Text name="ip" label="IP" disabled={readOnly} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Field.Select name="province" label="استان" disabled={readOnly}>
                  {provinces.map((p) => (
                    <MenuItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>

              <Grid item xs={12} md={6}>
                <Field.Select name="city" label="شهر" disabled={readOnly || !selectedProvince}>
                  {cities.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>

              <Grid item xs={12} md={6}>
                <Field.Text name="phone" label="تلفن" disabled={readOnly} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Field.Text name="max_users" label="حداکثر کاربران" type="number" disabled={readOnly} />
              </Grid>

              <Grid item xs={12}>
                <Field.Text name="address" label="آدرس" disabled={readOnly} />
              </Grid>

              <Grid item xs={12}>
                <Field.Text name="description" label="توضیحات" multiline rows={3} disabled={readOnly} />
              </Grid>

              <Grid item xs={12}>
                <Field.Switch name="is_active" label="فعال / غیرفعال" disabled={readOnly} />
              </Grid>

              {!readOnly && (
                <>
                  {/* فایل */}
                  <Grid item xs={12}>
                    <Button variant="outlined" component="label">
                      تغییر مدارک
                      <input
                        type="file"
                        hidden
                        multiple
                        onChange={(e) => setDocuments(Array.from(e.target.files))}
                      />
                    </Button>
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      color="warning"
                      loading={isSubmitting}
                    >
                      ویرایش شعبه
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EditBranchView;
