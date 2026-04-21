import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Box, Grid, MenuItem, Typography, NoSsr } from '@mui/material';
import { Field } from 'src/components/hook-form';

const REPRESENTATION_METHOD_OPTIONS = [
  { value: 'upload_document', label: 'بارگذاری سند نمایندگی' },
  { value: 'official_registry', label: 'استعلام پایگاه اطلاعات اشخاص حقوقی' },
];

export default function Page1() {
  const { control } = useFormContext();

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Field.Text name="national_id_asil" label="کد ملی اصیل" />
      </Grid>

      {/* شناسه ملی */}
      <Grid item xs={12} md={6}>
        <Field.Text name="national_id" label="شناسه ملی" />
      </Grid>

      {/* نحوه احراز نمایندگی */}
      <Box sx={{ width: { xs: '100%', md: '33%' } }}>
        <Field.Select name="representation_method" label="نحوه احراز نمایندگی">
          {REPRESENTATION_METHOD_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>

      {/* تاریخ سند نمایندگی */}
      <Grid item xs={12} md={4}>
        <NoSsr>
          <Field.DatePicker
            name="representation_doc_date"
            label="تاریخ سند نمایندگی"
            slotProps={{ textField: { fullWidth: true } }}
          />
        </NoSsr>
      </Grid>

      {/* شناسه سند رسمی */}
      <Grid item xs={12} md={4}>
        <Field.Text name="representation_doc_id" label="شناسه سند رسمی نمایندگی" />
      </Grid>

      {/* رمز تصدیق */}
      <Grid item xs={12} md={4}>
        <Field.Text name="verification_code" label="رمز تصدیق" />
      </Grid>

      {/* آپلود تصویر سند */}
      <Grid item xs={12}>
        <Controller
          name="representation_doc_image"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Box>
              <Typography variant="body2">تصویر سند نمایندگی:</Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Box
                  component="label"
                  sx={{
                    position: 'relative',
                    width: 320,
                    height: 90,
                    border: '1px solid',
                    borderColor: error ? 'error.main' : 'text.primary',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      field.onChange(file);
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '90%',
                      borderTop: '1px solid',
                      borderColor: 'text.secondary',
                      transform: 'translate(-50%, -50%) rotate(18deg)',
                      pointerEvents: 'none',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '90%',
                      borderTop: '1px solid',
                      borderColor: 'text.secondary',
                      transform: 'translate(-50%, -50%) rotate(-18deg)',
                      pointerEvents: 'none',
                    }}
                  />
                </Box>
              </Box>

              {field.value?.name ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  فایل انتخاب‌شده: {field.value.name}
                </Typography>
              ) : null}

              {error?.message ? (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {error.message}
                </Typography>
              ) : null}
            </Box>
          )}
        />
      </Grid>
    </Grid>
  );
}
