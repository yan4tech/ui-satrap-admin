import React from 'react';
import { Grid, MenuItem, Box } from '@mui/material';
import { Field } from 'src/components/hook-form';

const APPLICANT_ROLE_OPTIONS = [
  { value: 'legal_representative_individual', label: 'نماینده قانونی شخص حقیقی' },
  { value: 'original', label: 'اصیل' },
  { value: 'legal_representative_company', label: 'نماینده شخص حقوقی' },
];

const SANA_STATUS_OPTIONS = [
  { value: 'registered', label: 'در سامانه ثنا ثبت نام کرده است' },
  { value: 'not_registered', label: 'در سامانه ثنا ثبت نام نکرده است' },
];

export default function Page0() {
  return (
    <Grid container spacing={2}>
      {/* کد ملی متقاضی */}
      <Grid item xs={12} md={6}>
        <Field.Text name="national_id" label="کد ملی متقاضی" />
      </Grid>

      {/* شماره تلفن */}
      <Grid item xs={12} md={6}>
        <Field.Text name="mobile" label="شماره تلفن" />
      </Grid>

      {/* وضعیت ثبت نام در سامانه ثنا */}
      <Grid item xs={12} md={6}>
        <Field.Select name="sana_registration_status" label="وضعیت ثبت نام متقاضی در سامانه ثنا قوه قضاییه">
          {SANA_STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Grid>

      {/* سمت متقاضی (کمبو باکس) */}
      <Box sx={{ width: { xs: '100%', md: '50%' } }}>
        <Field.Select name="applicant_role" label="سمت متقاضی">
          {APPLICANT_ROLE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>
    </Grid>
  );
}
