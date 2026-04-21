import React from 'react';
import { Grid, MenuItem, Box, IconButton, Popover, Typography } from '@mui/material';
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

function InfoHint({ text }) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton size="small" color="info" onClick={handleOpen} sx={{ mt: 1, p: 0.5 }}>
        <Box
          sx={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: '1px solid',
            borderColor: 'info.main',
            color: 'info.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          i
        </Box>
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Typography variant="body2" sx={{ p: 1.5, maxWidth: 280, lineHeight: 1.7 }}>
          {text}
        </Typography>
      </Popover>
    </>
  );
}

export default function Page0() {
  return (
    <Grid container spacing={2}>
      {/* کد ملی متقاضی */}
      <Grid item xs={12} md={6}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Field.Text name="national_id" label="کد ملی متقاضی" />
          <InfoHint text="متقاضی باید دارای شرط سن قانونی (بالای 18 سال) و رشد ثابت شده باشد." />
        </Box>
      </Grid>

      {/* شماره تلفن */}
      <Grid item xs={12} md={6}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Field.Text name="mobile" label="شماره تلفن" />
          <InfoHint text="شماره تلفن باید در سامانه شاهکار به نام متقاضی ثبت شده باشد." />
        </Box>
      </Grid>

      {/* وضعیت ثبت نام در سامانه ثنا */}
      <Grid item xs={12} md={6}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Field.Select name="sana_registration_status" label="وضعیت ثبت نام متقاضی در سامانه ثنا قوه قضاییه">
            {SANA_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Field.Select>
          <InfoHint text="متقاضی باید در سامانه ثنا ثبت نام کرده باشد." />
        </Box>
      </Grid>

      {/* سمت متقاضی (کمبو باکس) */}
      <Box sx={{ width: { xs: '100%', md: '50%' } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Field.Select name="applicant_role" label="سمت متقاضی">
            {APPLICANT_ROLE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Field.Select>
          <InfoHint text="اطلاعات پایه (اصیل / نماینده قانونی شخص حقیقی / نماینده شخص حقوقی)." />
        </Box>
      </Box>
    </Grid>
  );
}
