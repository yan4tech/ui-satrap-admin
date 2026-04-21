import React from 'react';
import { useFormContext } from 'react-hook-form';
import { MenuItem, Box, IconButton, Popover, Typography } from '@mui/material';
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

const NOTE5_AWARENESS_OPTIONS = [
  { value: 'aware', label: 'مطلع هستم' },
  { value: 'not_aware', label: 'مطلع نیستم' },
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
  useFormContext();

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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Text name="national_id" label="کد ملی متقاضی" />
        <InfoHint text="متقاضی باید دارای شرط سن قانونی (بالای 18 سال) و رشد ثابت شده باشد." />
      </Box>

      {/* شماره تلفن */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Text name="applicant_mobile" label="شماره تلفن همراه متقاضی" />
        <InfoHint text="شماره تلفن باید در سامانه شاهکار به نام متقاضی ثبت شده باشد." />
      </Box>

      {/* وضعیت ثبت نام در سامانه ثنا */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Select
          name="sana_registration_status"
          label="وضعیت ثبت نام متقاضی در سامانه ثنا قوه قضاییه"
        >
          {SANA_STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
        <InfoHint text="متقاضی باید در سامانه ثنا ثبت نام کرده باشد." />
      </Box>

      {/* سمت متقاضی (کمبو باکس) */}
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

      {/* اعلام اطلاع متقاضی از مفاد تبصره ۵ ماده ۱۰ قانون */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Select name="note5_acknowledgment" label="اعلام اطلاع متقاضی از مفاد تبصره ۵ ماده ۱۰ قانون">
          {NOTE5_AWARENESS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
        <InfoHint text="متقاضی باید از مفاد تبصره مذکور مطلع باشد." />
      </Box>

      {/* کد رهگیری نقشه */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Text name="map_tracking_code" label="کد رهگیری نقشه" />
        <InfoHint text="متقاضی باید مجوز دسترسی به این نقشه را در سامانه ژئوا داشته باشد." />
      </Box>
    </Box>
  );
}
