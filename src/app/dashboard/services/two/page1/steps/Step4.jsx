import React from 'react';
import { MenuItem, Typography, Box } from '@mui/material';
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
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        columnGap: 3,
        rowGap: 2,
      }}
    >
      {/* آیا درخواست دسترسی دارد */}
      <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
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
      </Box>

      {/* لیست افراد (multi select) */}
      {/* <Grid item xs={12} md={6}>
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
      </Grid> */}
      <Box>
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
      </Box>
    </Box>
  );
}
