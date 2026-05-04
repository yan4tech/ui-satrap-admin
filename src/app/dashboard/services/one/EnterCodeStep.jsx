'use client';

import React, { useState } from 'react';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';

const CODE_OK = /^\d{4,6}$/;

export default function EnterCodeStep({ onEngineSubmit, engineSubmitting, engineSubmitError }) {
  const [code, setCode] = useState('');

  const trimmed = code.trim();
  const codeValid = CODE_OK.test(trimmed);

  const handleSubmit = async () => {
    if (!codeValid || engineSubmitting) return;
    await onEngineSubmit({ sms_code: trimmed });
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
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
        ورود کد پیامک
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        کد ارسال‌شده به شمارهٔ ثبت‌شده را وارد کنید؛ سپس با «ثبت این مرحله در موتور» تکمیل کنید. پس از آن دکمهٔ «بعدی» در پایین صفحه فعال می‌شود.
      </Typography>

      <TextField
        fullWidth
        label="کد تایید"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6, dir: 'ltr' }}
        placeholder="مثلاً 123456"
        sx={{ mb: 0.5 }}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        کد باید ۴ تا ۶ رقم باشد.
      </Typography>

      <Stack spacing={1} sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
        {engineSubmitError ? <Alert severity="error">{engineSubmitError}</Alert> : null}
        <Typography variant="caption" color="text.secondary">
          پس از وارد کردن کد، ثبت مرحله در موتور را بزنید تا دکمهٔ «بعدی» در پایین صفحه فعال شود.
        </Typography>
        <Button variant="contained" disabled={!codeValid || engineSubmitting} onClick={handleSubmit}>
          {engineSubmitting ? 'در حال ثبت…' : 'ثبت این مرحله در موتور'}
        </Button>
      </Stack>
    </Box>
  );
}
