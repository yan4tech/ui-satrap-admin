import React from 'react';
import { Grid, MenuItem, Typography, Box } from '@mui/material';
import { Field } from 'src/components/hook-form';

// ---------------- MOCK DATA ----------------
// (بعداً باید از API بیاد)
const PROVINCES = [
  { value: 1, label: 'تهران' },
  { value: 2, label: 'اصفهان' },
];

const COUNTIES = [
  { value: 1, label: 'شهرستان ۱' },
  { value: 2, label: 'شهرستان ۲' },
];

const CITIES = [
  { value: 1, label: 'شهر / روستا ۱' },
  { value: 2, label: 'شهر / روستا ۲' },
];

export default function Page2() {
  return (
    <>
      <Grid container spacing={2}>
        {/* ---------------- استان ---------------- */}
        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
          <Field.Select name="province" label="استان">
            {PROVINCES.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Field.Select>
        </Box>

        {/* ---------------- شهرستان ---------------- */}
        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
          <Field.Select name="county" label="شهرستان">
            {COUNTIES.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Field.Select>
        </Box>

        {/* ---------------- شهر / روستا ---------------- */}
        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
          <Field.Select name="city" label="شهر / روستا">
            {CITIES.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Field.Select>
        </Box>

        {/* ---------------- کد پستی ---------------- */}
        <Grid item xs={12} md={12}>
          <Field.Text name="postal_code" label="کد پستی" />
        </Grid>

        {/* ---------------- مختصات جغرافیایی ---------------- */}
        <Grid item xs={12}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              مختصات جغرافیایی یک نقطه از ملک
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Field.Text name="longitude" label="طول جغرافیایی" />
              </Grid>

              <Grid item xs={12} md={6}>
                <Field.Text name="latitude" label="عرض جغرافیایی" />
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Field.Text name="property_address" label="نشانی ملک" multiline rows={6} fullWidth />
      </Box>
    </>
  );
}
