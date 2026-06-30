'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Alert, Box, Stack, Typography } from '@mui/material';

const REGISTRY_STATUS_LABELS = {
  SUCCESS: 'موفق',
  APPROVED: 'تأیید شده',
  FAILED: 'ناموفق',
  PENDING: 'در انتظار',
  REJECTED: 'رد شده',
};

function formatRegistryStatus(value) {
  if (value == null || value === '') return '—';
  const key = String(value).trim().toUpperCase();
  return REGISTRY_STATUS_LABELS[key] ?? String(value);
}

function ReadOnlyRow({ label, value }) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700}>
        {label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {value || '—'}
      </Typography>
    </Box>
  );
}

export default function RegistrationTrackingStep() {
  const { watch } = useFormContext();
  const registryResponse = watch('registrationTracking.registry_response') ?? {};
  const registryStatus = watch('registrationTracking.registry_status');
  const registryReferenceId = watch('registrationTracking.registry_reference_id');

  const referenceId =
    registryReferenceId || registryResponse?.reference_id || registryResponse?.referenceId || '';
  const statusLabel = formatRegistryStatus(registryStatus ?? registryResponse?.status);
  const message = registryResponse?.message || '';

  const hasData = Boolean(referenceId || (statusLabel && statusLabel !== '—') || message);

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
        نمایش پاسخ ثبت
      </Typography>

      <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
        پاسخ استعلام ثبتی سازمان در این مرحله نمایش داده می‌شود. پس از بررسی، «ثبت نهایی» را بزنید.
      </Alert>

      <Stack spacing={2}>
        {!hasData ? (
          <Alert severity="warning" variant="outlined">
            پاسخ سازمان ثبت هنوز در دسترس نیست؛ پس از تکمیل استعلام ثبتی دوباره تلاش کنید.
          </Alert>
        ) : (
          <>
            <ReadOnlyRow label="شناسه مرجع سازمان ثبت" value={referenceId} />
            <ReadOnlyRow label="وضعیت استعلام ثبتی" value={statusLabel} />
            {message ? <ReadOnlyRow label="پیام سازمان ثبت" value={message} /> : null}
          </>
        )}
      </Stack>
    </Box>
  );
}
