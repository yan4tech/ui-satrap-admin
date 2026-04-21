'use client';

import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';

function formatPrice(value) {
  return new Intl.NumberFormat('fa-IR').format(value);
}

export default function SurveyPaymentStepPage() {
  const serviceName = 'پرداخت مرحله نقشه برداری';
  const servicePrice = 950000;

  const handlePayClick = () => {
    alert('اتصال به درگاه پرداخت مرحله نقشه‌برداری در این بخش انجام می‌شود.');
  };

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
        پرداخت مرحله نقشه برداری
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          نام خدمت: {serviceName}
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          قیمت خدمت: {formatPrice(servicePrice)} ریال
        </Typography>
      </Stack>

      <Button variant="contained" color="primary" onClick={handlePayClick}>
        پرداخت
      </Button>
    </Box>
  );
}
