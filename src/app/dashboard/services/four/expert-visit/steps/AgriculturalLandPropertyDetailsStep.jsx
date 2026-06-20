import React from 'react';
import { useWatch } from 'react-hook-form';
import { Box, IconButton, MenuItem, Popover, Typography } from '@mui/material';

import { Field } from 'src/components/hook-form';

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

export default function AgriculturalLandPropertyDetailsStep() {
  const propertyType = useWatch({ name: 'expertVisit.visit_property_type' });

  if (propertyType !== 'agricultural_land') {
    return null;
  }

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
          name="expertVisit.visit_agricultural_land_under_cultivation"
          label="آیا زمین زیر کشت است؟"
          fullWidth
        >
          {YES_NO_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
        <InfoHint text="وضعیت کشت فعلی زمین مزروعی در زمان بازدید کارشناس." />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Text
          name="expertVisit.visit_agricultural_land_cultivation_type"
          label="نوع کشت"
          fullWidth
        />
        <InfoHint text="نوع محصول یا کشت مشاهده‌شده در زمین (مثلاً گندم، برنج، باغات و ...)." />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Select name="expertVisit.visit_agricultural_land_fence" label="آیا حصار دارد؟" fullWidth>
          {YES_NO_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
        <InfoHint text="وجود حصار، دیوار یا محدودکننده فیزیکی دور زمین مزروعی." />
      </Box>

      <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
        <Field.Text
          name="expertVisit.visit_agricultural_land_description"
          label="توضیحات"
          multiline
          rows={3}
          fullWidth
        />
      </Box>
    </Box>
  );
}
