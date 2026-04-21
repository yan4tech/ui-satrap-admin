import React from 'react';
import { MenuItem, Box } from '@mui/material';
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
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        columnGap: 3,
        rowGap: 2,
      }}
    >
      {/* نوع ملک */}
      <Box>
        <Field.Select name="property_type" label="نوع ملک">
          {PROPERTY_TYPE_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>

      {/* آیا ملک اعتباری دارد */}
      <Box>
        <Field.Select name="has_credit" label="آیا ملک اعتباری دارد">
          {CREDIT_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>

      {/* کاربری ملک */}
      <Box>
        <Field.Select name="property_usage" label="کاربری ملک">
          {USAGE_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>

      {/* مساحت تقریبی ملک */}
      <Box>
        <Field.Text name="approx_area" label="مساحت تقریبی ملک (متر مربع)" type="number" />
      </Box>

      {/* تعداد منضمات (پارکینگ / انباری) */}
      <Box>
        <Field.Text
          name="attachments_count"
          label="تعداد منضمات (پارکینگ + انباری)"
          type="number"
        />
      </Box>
    </Box>
  );
}
