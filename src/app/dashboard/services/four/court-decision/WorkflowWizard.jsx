'use client';

import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  Alert,
  Box,
  Card,
  CardContent,
  IconButton,
  NoSsr,
  Popover,
  Stack,
  Typography,
} from '@mui/material';

import { Field } from 'src/components/hook-form';

import ExpertObjectionRejectionReview from './steps/ExpertObjectionRejectionReview';

const COURT_DECISION_FIELDS = [
  { name: 'courtDecision.court_decision_date', label: 'تاریخ رأی دادگاه', type: 'date', required: true },
  {
    name: 'courtDecision.court_decision_image',
    label: 'تصویر رأی دادگاه',
    type: 'file',
    required: true,
    helperText: 'تصویر یا فایل PDF رأی دادگاه را بارگذاری کنید',
  },
];

function InfoHint({ text }) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  return (
    <>
      <IconButton size="small" color="info" onClick={(event) => setAnchorEl(event.currentTarget)} sx={{ mt: 1, p: 0.5 }}>
        <Box
          sx={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: '1px solid',
            borderColor: 'info.main',
            color: 'info.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          i
        </Box>
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Typography sx={{ p: 1.5, maxWidth: 320 }} variant="body2">
          {text}
        </Typography>
      </Popover>
    </>
  );
}

function UploadBox({ name, label, helperText, accept = 'image/*,.pdf' }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {label}
          </Typography>

          <Box
            component="label"
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: 72,
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
                field.onChange(file);
              }}
            />

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
              {field.value?.name ||
                (typeof field.value === 'string' && field.value.trim()) ||
                helperText}
            </Typography>
          </Box>

          {error?.message ? (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {error.message}
            </Typography>
          ) : null}
        </Box>
      )}
    />
  );
}

function CourtDecisionField({ field }) {
  if (field.type === 'file') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Box sx={{ width: '100%' }}>
          <UploadBox name={field.name} label={field.label} helperText={field.helperText} />
        </Box>
        {field.required ? <InfoHint text="اجباری" /> : null}
      </Box>
    );
  }

  if (field.type === 'date') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <NoSsr>
          <Field.DatePicker name={field.name} label={field.label} slotProps={{ textField: { fullWidth: true } }} />
        </NoSsr>
        {field.required ? <InfoHint text="اجباری" /> : null}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
      <Field.Text name={field.name} label={field.label} />
      {field.required ? <InfoHint text="اجباری" /> : null}
    </Box>
  );
}

export default function CourtDecisionWorkflowWizard() {
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
        ارسال رأی دادگاه
      </Typography>

      <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
        پرونده دارای اعتراض است. تاریخ و تصویر رأی دادگاه صادرشده را ثبت کنید.
      </Alert>

      <Stack spacing={3}>
        <Card variant="outlined">
          <CardContent>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                columnGap: 3,
                rowGap: 2,
              }}
            >
              {COURT_DECISION_FIELDS.map((field) => (
                <Box
                  key={field.name}
                  sx={{ gridColumn: field.type === 'file' ? { xs: 'span 1', md: 'span 2' } : undefined }}
                >
                  <CourtDecisionField field={field} />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        <ExpertObjectionRejectionReview />
      </Stack>
    </Box>
  );
}
