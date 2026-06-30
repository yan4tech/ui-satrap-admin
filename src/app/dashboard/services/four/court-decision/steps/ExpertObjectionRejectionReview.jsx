import React from 'react';
import { Alert, Box, IconButton, MenuItem, Popover, Typography } from '@mui/material';

import { Field } from 'src/components/hook-form';

const OBJECTION_REJECTION_STATUS_OPTIONS = [
  { value: 'verified', label: 'رد اعتراض احراز شد' },
  { value: 'not_verified', label: 'احراز نشد' },
];

function InfoHint({ text }) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  return (
    <>
      <IconButton size="small" color="info" onClick={(event) => setAnchorEl(event.currentTarget)} sx={{ mt: 1, p: 0.5 }}>
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
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Typography variant="body2" sx={{ p: 1.5, maxWidth: 320, lineHeight: 1.7 }}>
          {text}
        </Typography>
      </Popover>
    </>
  );
}

/**
 * UI کارشناس رد اعتراض — الگو از page1/steps/ExpertRepresentationReview.jsx
 */
export default function ExpertObjectionRejectionReview() {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        p: 2,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        بررسی کارشناس رد اعتراض
      </Typography>

      <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
        این بخش توسط کارشناس امور ثبتی و حقوقی تکمیل می‌شود.
      </Alert>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          columnGap: 3,
          rowGap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Field.Text name="courtDecision.expert_national_id" label="کد ملی کارشناس امور ثبتی و حقوقی" />
          <InfoHint text="کارشناس باید از افراد مجاز برای کارشناسی موضوع ماده ۴ دستورالعمل باشد." />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Field.Select name="courtDecision.expert_objection_rejection_opinion" label="نظر کارشناسی مبنی بر رد اعتراض">
            {OBJECTION_REJECTION_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Field.Select>
          <InfoHint text="در صورت عدم احراز رد اعتراض توسط کارشناس، ادامه فرایند انجام نخواهد شد." />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
          <Field.Text
            name="courtDecision.expert_objection_description"
            label="توضیحات کارشناس"
            multiline
            rows={3}
          />
        </Box>
      </Box>
    </Box>
  );
}
