'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Alert, Box, Stack, Typography } from '@mui/material';

import { Field } from 'src/components/hook-form';

import { ClaimMapDataTimeline } from '../../_components/process-work-timeline';

export default function ClaimConfirmationStep() {
  const { watch } = useFormContext();
  const claimMapData = watch('claimConfirmation.claim_map_data') ?? {};

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: { xs: 2, md: 3 },
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        تأیید اطلاعات ادعا
      </Typography>

      <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
        اطلاعات زیر بر اساس داده‌های ثبت‌شده و پاسخ سازمان نمایش داده می‌شود. پس از بررسی، صحت آن را تأیید
        کنید.
      </Alert>

      <Stack spacing={2}>
        <ClaimMapDataTimeline claimMapData={claimMapData} />

        <Field.Checkbox
          name="claimConfirmation.claim_confirmed"
          label="اطلاعات ادعای نمایش‌داده‌شده را مطابق واقع بررسی کرده و تأیید می‌کنم."
        />
      </Stack>
    </Box>
  );
}
