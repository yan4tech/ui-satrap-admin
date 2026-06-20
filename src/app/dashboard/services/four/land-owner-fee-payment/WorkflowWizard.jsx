'use client';

import React from 'react';
import { Alert, Box, Card, CardContent, NoSsr, Stack, Typography } from '@mui/material';

import { Field } from 'src/components/hook-form';

function formatFeeAmount(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '—';
  const numeric = Number(raw.replace(/,/g, ''));
  if (Number.isFinite(numeric)) {
    try {
      return new Intl.NumberFormat('fa-IR').format(numeric);
    } catch {
      return raw;
    }
  }
  return raw;
}

export default function LandOwnerFeePaymentWorkflowWizard({
  landOwnerFeeAmount = '',
  sheba = '',
} = {}) {
  const feeRequired = Number(String(landOwnerFeeAmount ?? '').replace(/,/g, '')) > 0;

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
        پرداخت اجرت/بهای عرصه (ماده ۱۲)
      </Typography>

      <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
        {feeRequired
          ? 'مبلغ اجرت/بهای عرصه توسط سازمان اعلام شده است. پس از واریز به حساب اعلام‌شده، کد رهگیری، بانک و تاریخ/زمان واریز را ثبت کنید.'
          : 'مبلغ اجرت/بهای عرصه (ماده ۱۲) برای این پرونده صفر است؛ در صورت اعلام مبلغ توسط سازمان، این بخش تکمیل می‌شود.'}
      </Alert>

      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
              اطلاعات اعلام‌شده توسط سازمان
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                columnGap: 3,
                rowGap: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  مبلغ اجرت/بهای عرصه
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatFeeAmount(landOwnerFeeAmount)} {feeRequired ? 'ریال' : ''}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  شماره شبا
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {sheba || '—'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {feeRequired ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                جزئیات واریز متقاضی
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  columnGap: 3,
                  rowGap: 2,
                }}
              >
                <Field.Text
                  name="landOwnerFeePayment.land_owner_fee_payment_tracking_code"
                  label="کد رهگیری پرداخت"
                />
                <Field.Text name="landOwnerFeePayment.land_owner_fee_payment_bank" label="بانک واریز" />
                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                  <NoSsr>
                    <Field.DateTimePicker
                      name="landOwnerFeePayment.land_owner_fee_payment_deposit_at"
                      label="تاریخ و زمان واریز"
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </NoSsr>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Box>
  );
}
