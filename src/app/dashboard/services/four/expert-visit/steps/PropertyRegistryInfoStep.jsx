import React from 'react';
import { Box, IconButton, Popover, Typography } from '@mui/material';

import { Field } from 'src/components/hook-form';

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

export default function PropertyRegistryInfoStep() {
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
        <Field.Text
          name="expertVisit.visit_main_plaque_number"
          label="پلاک ثبتی اصلی"
          fullWidth
        />
        <InfoHint text="پلاک ثبتی اصلی ملک مطابق اطلاعات مشاهده‌شده در بازدید." />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Text name="expertVisit.visit_sub_plaque_number" label="پلاک ثبتی فرعی" fullWidth />
        <InfoHint text="در صورت وجود پلاک فرعی، آن را وارد کنید." />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Text name="expertVisit.visit_registration_section" label="بخش ثبتی" fullWidth />
        <InfoHint text="بخش ثبتی ملک در دفترخانه اسناد رسمی." />
      </Box>

      <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' }, mt: 0.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          سهم مشاعی
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Text
          name="expertVisit.visit_joint_share_total"
          label="تعداد سهم کل"
          fullWidth
          type="number"
          slotProps={{ htmlInput: { min: 1 } }}
        />
        <InfoHint text="مخرج سهم مشاعی ملک (تعداد کل سهام)." />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Text
          name="expertVisit.visit_joint_share_partial"
          label="تعداد سهم جزء"
          fullWidth
          type="number"
          slotProps={{ htmlInput: { min: 1 } }}
        />
        <InfoHint text="صورت سهم مشاعی ملک (سهم مورد ادعا از کل)." />
      </Box>

      <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' }, mt: 0.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          نسبت تصرف به سهم
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Text
          name="expertVisit.visit_possession_to_share_total"
          label="سهم کل (نسبت تصرف)"
          fullWidth
          type="number"
          slotProps={{ htmlInput: { min: 1 } }}
        />
        <InfoHint text="مخرج نسبت تصرف متقاضی نسبت به سهم مشاعی." />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Text
          name="expertVisit.visit_possession_to_share_partial"
          label="سهم جزء (نسبت تصرف)"
          fullWidth
          type="number"
          slotProps={{ htmlInput: { min: 1 } }}
        />
        <InfoHint text="صورت نسبت تصرف متقاضی نسبت به سهم مشاعی." />
      </Box>
    </Box>
  );
}
