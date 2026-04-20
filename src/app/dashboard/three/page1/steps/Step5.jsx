import React from 'react';
import { Grid, MenuItem } from '@mui/material';
import { Field } from 'src/components/hook-form';

// ---------------- OPTIONS ----------------
const SURVEYOR_OPTIONS = [
  { value: 'surveyor_1', label: 'کارشناس شماره 1' },
  { value: 'surveyor_2', label: 'کارشناس شماره 2' },
  { value: 'surveyor_3', label: 'کارشناس شماره 3' },
];

// ---------------- COMPONENT ----------------
export default function Page5() {
  return (
    <Grid container spacing={2}>
      {/* تخصیص کارشناس نقشه‌برداری */}
      <Grid item xs={12} md={6}>
        <Field.Select name="survey_assignment" label="تخصیص کارشناس نقشه‌برداری">
          {SURVEYOR_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Grid>
    </Grid>
  );
}
