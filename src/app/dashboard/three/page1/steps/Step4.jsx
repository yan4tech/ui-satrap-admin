import React from 'react';
import { Grid, MenuItem } from '@mui/material';
import { Field } from 'src/components/hook-form';

// ---------------- OPTIONS ----------------
const ACCESS_REQUEST_OPTIONS = [
  { value: 'yes', label: 'بله' },
  { value: 'no', label: 'خیر' },
];

const PEOPLE_OPTIONS = [
  { value: 'person1', label: 'شخص 1' },
  { value: 'person2', label: 'شخص 2' },
  { value: 'person3', label: 'شخص 3' },
];

// ---------------- COMPONENT ----------------
export default function Page4() {
  return (
    <Grid container spacing={2}>
      {/* آیا درخواست دسترسی دارد */}
      <Grid item xs={12} md={6}>
        <Field.Select
          name="has_map_access_request"
          label="آیا متقاضی درخواست اعطای دسترسی اشخاص دیگر به نقشه را دارد؟"
        >
          {ACCESS_REQUEST_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Grid>

      {/* لیست افراد (multi select) */}
      <Grid item xs={12} md={6}>
        <Field.Select
          name="access_people"
          label="لیست افراد"
          multiple
          renderValue={(selected) =>
            selected?.map((val) => PEOPLE_OPTIONS.find((p) => p.value === val)?.label).join(', ')
          }
        >
          {PEOPLE_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Grid>
    </Grid>
  );
}
