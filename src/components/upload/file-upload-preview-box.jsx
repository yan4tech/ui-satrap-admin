import React from 'react';

import { Box, Stack, Typography } from '@mui/material';

import { useFilePreview } from './use-file-preview';

function PlaceholderLines() {
  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          width: '70%',
          borderTop: '1px solid',
          borderColor: 'text.secondary',
          transform: 'rotate(14deg)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '70%',
          borderTop: '1px solid',
          borderColor: 'text.secondary',
          transform: 'rotate(-14deg)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

export function FileUploadPreviewBox({
  value,
  onChange,
  accept = 'image/*',
  helperText = 'انتخاب فایل',
  label,
  error,
  minHeight = 72,
  width,
  height,
  showFileNameBelow = false,
}) {
  const { previewUrl, fileName, isImage, isPdf } = useFilePreview(value);
  const hasPreview = Boolean(previewUrl && isImage);

  return (
    <Box>
      {label ? (
        <Typography variant="body2" sx={{ mb: 1 }}>
          {label}
        </Typography>
      ) : null}

      <Box
        component="label"
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: width ?? '100%',
          ...(height ? { height } : { minHeight }),
          px: 2,
          border: '1px solid',
          borderColor: error ? 'error.main' : 'text.primary',
          cursor: 'pointer',
          backgroundColor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        <input
          type="file"
          accept={accept}
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            onChange(file);
          }}
        />

        {hasPreview ? (
          <Box
            component="img"
            src={previewUrl}
            alt={fileName || 'پیش‌نمایش تصویر'}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
          />
        ) : isPdf ? (
          <Stack alignItems="center" spacing={0.5} sx={{ zIndex: 1, px: 1, textAlign: 'center' }}>
            <Typography variant="body2" fontWeight={700}>
              PDF
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {fileName}
            </Typography>
          </Stack>
        ) : (
          <>
            <PlaceholderLines />
            <Typography
              variant="body2"
              sx={{
                zIndex: 1,
                backgroundColor: 'background.paper',
                px: 1,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {fileName || helperText}
            </Typography>
          </>
        )}
      </Box>

      {showFileNameBelow && fileName && !hasPreview ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          فایل انتخاب‌شده: {fileName}
        </Typography>
      ) : null}

      {error?.message ? (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          {error.message}
        </Typography>
      ) : null}
    </Box>
  );
}
