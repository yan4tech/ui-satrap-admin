'use client';

import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Box, Grid, TextField, Typography } from '@mui/material';

function UploadBox({ name, label, helperText, accept }) {
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
              {field.value?.name || helperText}
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

export default function WorkflowWizardPage2() {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'text.primary',
        p: { xs: 2, md: 3 },
        display: 'grid',
        gap: 2,
      }}
    >
      <Typography variant="subtitle1" fontWeight={700}>
        نقشه برداری
      </Typography>

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'text.primary',
          borderRadius: 999,
          py: 0.5,
          px: 1.5,
          width: 'fit-content',
          maxWidth: '100%',
        }}
      >
        <Typography variant="body2">
          متقاضی/کارشناس می‌تواند با بارگذاری تصاویر ملک مورد تقاضا مطابقت بنا با ملک را تایید کند.
        </Typography>
      </Box>

      <Typography variant="body2" textAlign="center">
        چهار عکس از زوایای مختلف به همراه اطلاعات متقاضی ملک
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <UploadBox name="survey.image_1" label="عکس 1 :" helperText="انتخاب فایل تصویر" accept="image/*" />
        </Grid>
        <Grid item xs={12} md={6}>
          <UploadBox name="survey.image_2" label="عکس 2 :" helperText="انتخاب فایل تصویر" accept="image/*" />
        </Grid>
        <Grid item xs={12} md={6}>
          <UploadBox name="survey.image_3" label="عکس 3 :" helperText="انتخاب فایل تصویر" accept="image/*" />
        </Grid>
        <Grid item xs={12} md={6}>
          <UploadBox name="survey.image_4" label="عکس 4 :" helperText="انتخاب فایل تصویر" accept="image/*" />
        </Grid>
      </Grid>

      <Box sx={{ borderTop: '1px solid', borderColor: 'text.primary', mt: 1, pt: 1 }}>
        <Typography variant="body2" textAlign="center">
          نقشه به همراه اطلاعات توصیفی آن
        </Typography>
      </Box>

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'text.primary',
          borderRadius: 999,
          py: 0.5,
          px: 1.5,
          width: 'fit-content',
          maxWidth: '100%',
        }}
      >
        <Typography variant="body2">
          نقشه و اطلاعات توصیفی آن باید با اسناد استنادی فایل سامانه مطابقت داشته باشد.
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 520 }}>
        <UploadBox name="survey.map_file" label="نقشه :" helperText="انتخاب فایل نقشه" accept=".pdf,.jpg,.jpeg,.png" />
      </Box>

      <Controller
        name="survey.description"
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            fullWidth
            multiline
            rows={6}
            label="توصیفات :"
            placeholder="توضیحات کامل وضعیت ملک، مشکلات احتمالی، مغایرت‌ها و سایر موارد مرتبط را ثبت کنید."
            error={!!error}
            helperText={error?.message}
          />
        )}
      />
    </Box>
  );
}
