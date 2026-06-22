'use client';

import React from 'react';
import { Alert, Stack } from '@mui/material';

import { SERVICE_LABELS } from 'src/lib/service-labels';

export default function StartServiceStep({ error, serviceTitle = SERVICE_LABELS.service1 }) {
  return (
    <Stack spacing={2} alignItems="center" sx={{ width: '100%', maxWidth: 520, mx: 'auto' }}>
      <Alert
        severity="info"
        variant="outlined"
        sx={{
          borderColor: 'divider',
          bgcolor: 'action.hover',
          color: 'text.secondary',
          width: '100%',
          '& .MuiAlert-icon': { color: 'info.main', opacity: 0.75 },
          '& .MuiAlert-message': { textAlign: 'center', width: '100%' },
        }}
      >
        برای شروع {serviceTitle} لطفا روی دکمه بعدی کلیک کنید.
      </Alert>
      {error ? (
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      ) : null}
    </Stack>
  );
}
