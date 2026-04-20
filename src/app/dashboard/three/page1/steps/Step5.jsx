import React from 'react';
import { Box, Grid, MenuItem } from '@mui/material';
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
    <Box sx={{ width: { xs: '100%', md: '50%' } }}>
      <Field.Select name="survey_assignment" label="تخصیص کارشناس نقشه‌برداری" fullWidth>
        {SURVEYOR_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </Field.Select>
    </Box>
  );
}
