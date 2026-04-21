import React from 'react';
import { MenuItem, Typography, Box } from '@mui/material';
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
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          columnGap: 3,
          rowGap: 2,
        }}
      >
        {/* ---------------- استان ---------------- */}
        <Box>
          <Field.Select name="province" label="استان">
            {PROVINCES.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Field.Select>
        </Box>

        {/* ---------------- شهرستان ---------------- */}
        <Box>
          <Field.Select name="county" label="شهرستان">
            {COUNTIES.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Field.Select>
        </Box>

        {/* ---------------- شهر / روستا ---------------- */}
        <Box>
          <Field.Select name="city" label="شهر / روستا">
            {CITIES.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Field.Select>
        </Box>

        {/* ---------------- کد پستی ---------------- */}
        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
          <Field.Text name="postal_code" label="کد پستی" />
        </Box>

        {/* ---------------- مختصات جغرافیایی ---------------- */}
        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              مختصات جغرافیایی یک نقطه از ملک
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
                <Field.Text name="longitude" label="طول جغرافیایی" />
              </Box>

              <Box>
                <Field.Text name="latitude" label="عرض جغرافیایی" />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Field.Text name="property_address" label="نشانی ملک" multiline rows={6} fullWidth />
      </Box>
    </>
  );
}
