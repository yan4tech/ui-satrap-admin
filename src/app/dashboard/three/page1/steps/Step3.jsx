import React from 'react';
import { Grid, MenuItem, Box } from '@mui/material';
import { Field } from 'src/components/hook-form';

// ---------------- OPTIONS ----------------
const PROPERTY_TYPE_OPTIONS = [
  { value: 'apartment', label: 'آپارتمان' },
  { value: 'land', label: 'زمین' },
];

const CREDIT_OPTIONS = [
  { value: 'yes', label: 'بله' },
  { value: 'no', label: 'خیر' },
];

const USAGE_OPTIONS = [
  { value: 'residential', label: 'مسکونی' },
  { value: 'commercial', label: 'تجاری' },
];

// ---------------- COMPONENT ----------------
export default function Page3() {
  return (
    <Grid container spacing={2}>
      {/* نوع ملک */}
      <Box sx={{ width: { xs: '100%', md: '50%' } }}>
        <Field.Select name="property_type" label="نوع ملک">
          {PROPERTY_TYPE_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>

      {/* آیا ملک اعتباری دارد */}
      <Box sx={{ width: { xs: '100%', md: '50%' } }}>
        <Field.Select name="has_credit" label="آیا ملک اعتباری دارد">
          {CREDIT_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>

      {/* کاربری ملک */}
      <Box sx={{ width: { xs: '100%', md: '50%' } }}>
        <Field.Select name="property_usage" label="کاربری ملک">
          {USAGE_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>

      {/* مساحت تقریبی ملک */}
      <Box sx={{ width: { xs: '100%', md: '50%' } }}>
        <Field.Text name="approx_area" label="مساحت تقریبی ملک (متر مربع)" type="number" />
      </Box>

      {/* تعداد منضمات (پارکینگ / انباری) */}
      <Grid item xs={12} md={6}>
        <Field.Text
          name="attachments_count"
          label="تعداد منضمات (پارکینگ + انباری)"
          type="number"
        />
      </Grid>
    </Grid>
  );
}
