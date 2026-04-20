import React from 'react';
import { Grid, MenuItem, Typography } from '@mui/material';
import { Field } from 'src/components/hook-form';

// ---------------- OPTIONS ----------------
const ACCESS_REQUEST_OPTIONS = [
  { value: 'yes', label: 'بله' },
  { value: 'no', label: 'خیر' },
];

const PEOPLE_OPTIONS = ['شخص 1', 'شخص 2', 'شخص 3'];

// ---------------- COMPONENT ----------------
export default function Page4() {
  return (
    <Grid container spacing={2}>
      {/* آیا درخواست دسترسی دارد */}
      <Grid item xs={12} md={12}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          آیا متقاضی درخواست اعطای دسترسی اشخاص دیگر به نقشه را دارد؟
        </Typography>
        <Field.Select name="has_map_access_request" label="وضعیت درخواست دسترسی">
          {ACCESS_REQUEST_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Grid>

      {/* لیست افراد (multi select) */}
      <Grid item xs={6} sm={6} md={6}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          لیست افراد
        </Typography>
        <Field.Autocomplete
          name="access_people"
          label="انتخاب افراد"
          placeholder="یک یا چند نفر را انتخاب کنید"
          options={PEOPLE_OPTIONS}
          multiple
          disableCloseOnSelect
          filterSelectedOptions
        />
      </Grid>
    </Grid>
  );
}
