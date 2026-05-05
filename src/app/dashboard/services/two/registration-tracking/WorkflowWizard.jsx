'use client';

import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

import { Field } from 'src/components/hook-form';

export default function RegistrationTrackingStep() {
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
        ورود کد پیامک
      </Typography>

      <Stack spacing={2}>
        <Field.Text
          name="registrationTracking.sentTrackingCode"
          label="کد رهگیری ارسالی"
          placeholder="کد رهگیری ارسالی را وارد کنید"
        />
      </Stack>
    </Box>
  );
}
