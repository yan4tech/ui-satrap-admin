'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';

import { Box, Alert, Stack, Button, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';

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

function resolveDownloadUrl(rawPath) {
  if (!rawPath || rawPath === '-') return null;
  const path = String(rawPath).trim();
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
  return `/${normalizedPath}`;
}

export default function IssuedDocumentStep() {
  const { watch } = useFormContext();
  const issuedDocument = watch('issuedDocument') ?? {};

  const documentNumber =
    issuedDocument.issued_document_number ||
    issuedDocument.document_number ||
    issuedDocument.number ||
    '';
  const documentDate =
    issuedDocument.issued_document_date ||
    issuedDocument.document_date ||
    issuedDocument.date ||
    '';
  const downloadUrlRaw =
    issuedDocument.issued_document_download_url ||
    issuedDocument.download_url ||
    issuedDocument.document_download_url ||
    '';
  const downloadUrl = resolveDownloadUrl(downloadUrlRaw);

  const hasData = Boolean(documentNumber || documentDate || downloadUrl);

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
        نمایش صدور سند
      </Typography>

      <Alert severity="success" variant="outlined" sx={{ mb: 2 }}>
        سند رسمی مطابق قانون تعیین تکلیف صادر شده است. پس از بررسی اطلاعات، «ثبت نهایی» را بزنید.
      </Alert>

      <Stack spacing={2}>
        {!hasData ? (
          <Alert severity="warning" variant="outlined">
            اطلاعات سند صادرشده هنوز در دسترس نیست؛ پس از تکمیل مرحله صدور سند دوباره تلاش کنید.
          </Alert>
        ) : (
          <>
            <ReadOnlyRow label="شماره سند" value={documentNumber} />
            <ReadOnlyRow label="تاریخ صدور" value={documentDate} />
            {downloadUrl ? (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  دانلود سند
                </Typography>
                <Button
                  component="a"
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  size="small"
                  startIcon={<Iconify icon="solar:download-bold-duotone" width={18} />}
                >
                  دریافت فایل سند (نمایشی)
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {downloadUrlRaw}
                </Typography>
              </Box>
            ) : (
              <ReadOnlyRow label="لینک دانلود" value="—" />
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}
