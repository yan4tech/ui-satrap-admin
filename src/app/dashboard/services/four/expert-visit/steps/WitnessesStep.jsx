import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Box, IconButton, Popover, Typography } from '@mui/material';

import { Field } from 'src/components/hook-form';

import { MIN_VISIT_WITNESS_COUNT } from '../schemas';

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

function WitnessFileUpload({ name, label, hint }) {
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
                  `فایل ${label} را انتخاب کنید`}
              </Typography>
            </Box>
            {hint ? <InfoHint text={hint} /> : null}
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

export default function WitnessesStep() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="body2" color="text.secondary">
        حداقل {MIN_VISIT_WITNESS_COUNT} شاهد با اطلاعات هویتی و تصاویر کارت ملی و گواهی الزامی است.
      </Typography>

      {Array.from({ length: MIN_VISIT_WITNESS_COUNT }, (_, index) => (
        <Box
          key={`witness-${index}`}
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} mb={2}>
            شاهد {index + 1}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              columnGap: 3,
              rowGap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Field.Text
                name={`expertVisit.visit_witnesses.${index}.name`}
                label="نام و نام خانوادگی"
                fullWidth
              />
              <InfoHint text="نام کامل شاهد مطابق مدارک هویتی." />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Field.Text
                name={`expertVisit.visit_witnesses.${index}.national_id`}
                label="کد ملی"
                fullWidth
                inputProps={{ maxLength: 10 }}
              />
              <InfoHint text="کد ملی ۱۰ رقمی شاهد (بالای ۱۸ سال)." />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Field.Text
                name={`expertVisit.visit_witnesses.${index}.mobile`}
                label="شماره موبایل"
                fullWidth
                inputProps={{ maxLength: 11 }}
              />
              <InfoHint text="شماره موبایل شاهد مطابق سامانه شاهکار." />
            </Box>

            <WitnessFileUpload
              name={`expertVisit.visit_witnesses.${index}.national_card_image`}
              label="تصویر کارت ملی"
              hint="تصویر واضح از روی کارت ملی شاهد."
            />

            <WitnessFileUpload
              name={`expertVisit.visit_witnesses.${index}.certificate_image`}
              label="تصویر گواهی"
              hint="تصویر گواهی شهادت شاهد در بازدید."
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
