import React from 'react';
import { Box, IconButton, MenuItem, Popover, Typography } from '@mui/material';
import { useWatch } from 'react-hook-form';

import { Field } from 'src/components/hook-form';

const POSSESSION_MAP_MATCH_OPTIONS = [
  { value: 'yes', label: 'بله' },
  { value: 'partial', label: 'بخشی از آن' },
  { value: 'no', label: 'خیر' },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: 'land', label: 'زمین' },
  { value: 'apartment', label: 'آپارتمان' },
  { value: 'villa', label: 'ویلایی' },
  { value: 'building', label: 'ساختمان' },
  { value: 'agricultural_land', label: 'زمین مزروعی' },
  { value: 'garden', label: 'باغ' },
  { value: 'other', label: 'سایر' },
];

const PROPERTY_USAGE_OPTIONS = [
  { value: 'residential', label: 'مسکونی' },
  { value: 'commercial', label: 'تجاری' },
  { value: 'administrative', label: 'اداری' },
  { value: 'agricultural', label: 'کشاورزی' },
  { value: 'other', label: 'سایر' },
];

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'بلی' },
  { value: 'no', label: 'خیر' },
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Typography sx={{ p: 1.5, maxWidth: 320 }} variant="body2">
          {text}
        </Typography>
      </Popover>
    </>
  );
}

export default function PropertyGeneralInfoStep() {
  const possessionMapMatchStatus = useWatch({
    name: 'expertVisit.visit_possession_map_match_status',
  });
  const requiresCorrectiveMapCode =
    possessionMapMatchStatus === 'partial' || possessionMapMatchStatus === 'no';

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        columnGap: 3,
        rowGap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Select
          name="expertVisit.visit_possession_map_match_status"
          label="تطابق تصرف با نقشه"
          fullWidth
        >
          {POSSESSION_MAP_MATCH_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
        <InfoHint text="وضعیت تطابق تصرف واقعی متقاضی با محدوده نقشه ادعا در محل بازدید." />
      </Box>

      {requiresCorrectiveMapCode ? (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Field.Text
            name="expertVisit.visit_corrective_map_tracking_code"
            label="کد رهگیری نقشه اصلاحی"
            fullWidth
          />
          <InfoHint text="در صورت عدم تطابق کامل تصرف با نقشه، کد رهگیری نقشه اصلاحی ثبت‌شده در سامانه ژئوا الزامی است و متقاضی باید دسترسی مانا به آن را داشته باشد." />
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Select name="expertVisit.visit_property_type" label="نوع ملک" fullWidth>
          {PROPERTY_TYPE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
        <InfoHint text="نوع ملک مشاهده‌شده در بازدید (زمین، ساختمان، باغ و ...)." />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Select name="expertVisit.visit_property_usage" label="کاربری ملک" fullWidth>
          {PROPERTY_USAGE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
        <InfoHint text="کاربری فعلی ملک (مسکونی، تجاری، کشاورزی و ...)." />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Select
          name="expertVisit.visit_neighbor_easement_rights"
          label="آیا حقوق ارتفاقی مجاورین وجود دارد؟"
          fullWidth
        >
          {YES_NO_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
        <InfoHint text="در صورت «بلی»، جزئیات حقوق ارتفاقی در بخش‌های بعدی تکمیل می‌شود." />
      </Box>
    </Box>
  );
}
