'use client';

import React from 'react';
import { Alert, Stack, Typography } from '@mui/material';

export default function StartServiceStep({ error }) {
  return (
    <Stack spacing={2}>
      <Typography variant="body1" color="text.secondary">
        با زدن «بعدی» فرایند خدمت شماره یک در موتور BPMN شروع می‌شود و مراحل بعدی بر اساس تسک‌های فعال نمایش داده
        می‌شوند.
      </Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
    </Stack>
  );
}
