import React from 'react';
import { MenuItem, Box } from '@mui/material';
import { Field } from 'src/components/hook-form';

const APPLICANT_ROLE_OPTIONS = [
  { value: 'legal_representative_individual', label: 'نماینده قانونی شخص حقیقی' },
  { value: 'original', label: 'اصیل' },
  { value: 'legal_representative_company', label: 'نماینده شخص حقوقی' },
];

export default function Page0() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        columnGap: 3,
        rowGap: 2,
      }}
    >
      {/* کد ملی متقاضی */}
      <Box>
        <Field.Text name="national_id" label="کد ملی متقاضی" />
      </Box>

      {/* شماره تلفن */}
      <Box>
        <Field.Text name="mobile" label="شماره تلفن" />
      </Box>

      {/* سمت متقاضی (کمبو باکس) */}
      <Box>
        <Field.Select name="applicant_role" label="سمت متقاضی">
          {APPLICANT_ROLE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>
    </Box>
  );
}
