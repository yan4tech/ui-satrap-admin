import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Box, IconButton, MenuItem, Popover, Typography } from '@mui/material';

import { Field } from 'src/components/hook-form';

const POSSESSION_VERIFICATION_STATUS_OPTIONS = [
  { value: 'established', label: 'محرز شد' },
  { value: 'not_established', label: 'محرز نشد' },
];

function InfoHint({ text }) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton size="small" color="info" onClick={handleOpen} sx={{ mt: 1, p: 0.5 }}>
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
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Typography sx={{ p: 1.5, maxWidth: 320 }} variant="body2">
          {text}
        </Typography>
      </Popover>
    </>
  );
}

function PossessionLocationImageUpload() {
  const { control } = useFormContext();

  return (
    <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
      <Controller
        name="expertVisit.visit_possession_location_image"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              تصویر محل تصرف
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Box
                component="label"
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  minHeight: 90,
                  px: 2,
                  border: '1px solid',
                  borderColor: error ? 'error.main' : 'text.primary',
                  cursor: 'pointer',
                  backgroundColor: 'background.paper',
                  overflow: 'hidden',
                  flex: 1,
                }}
              >
                <input
                  type="file"
                  accept="image/*,.pdf"
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
                    'فایل تصویر محل تصرف را انتخاب کنید'}
                </Typography>
              </Box>
              <InfoHint text="تصویر محل تصرف متقاضی که در بازدید کارشناس ثبت شده است." />
            </Box>

            {error?.message ? (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {error.message}
              </Typography>
            ) : null}
          </Box>
        )}
      />
    </Box>
  );
}

export default function PossessionVerificationStep() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        columnGap: 3,
        rowGap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Select
          name="expertVisit.visit_possession_verification_status"
          label="نتیجه احراز تصرف"
          fullWidth
        >
          {POSSESSION_VERIFICATION_STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
        <InfoHint text="نظر کارشناس درباره احراز تصرف متقاضی بر ملک (محرز شد یا محرز نشد)." />
      </Box>

      <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
        <Field.Text
          name="expertVisit.visit_possession_verification_description"
          label="توضیحات گزارش احراز تصرف"
          multiline
          rows={3}
          fullWidth
        />
      </Box>

      <PossessionLocationImageUpload />
    </Box>
  );
}
