import React from 'react';
import { Box, MenuItem } from '@mui/material';
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
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        columnGap: 3,
        rowGap: 2,
      }}
    >
      <Box>
        <Field.Select name="survey_assignment" label="تخصیص کارشناس نقشه‌برداری" fullWidth>
          {SURVEYOR_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>
    </Box>
  );
}
