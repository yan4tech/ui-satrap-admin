'use client';

import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Alert, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';

const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_CORRECTION: 'needs_correction',
};

const REVIEW_STATUS_META = {
  [REVIEW_STATUS.PENDING]: { label: 'در انتظار بررسی', color: 'warning', severity: 'warning' },
  [REVIEW_STATUS.APPROVED]: { label: 'تایید شد', color: 'success', severity: 'success' },
  [REVIEW_STATUS.REJECTED]: { label: 'رد شد', color: 'error', severity: 'error' },
  [REVIEW_STATUS.NEEDS_CORRECTION]: { label: 'نیاز به اصلاح', color: 'info', severity: 'info' },
};

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
  const [activeRole, setActiveRole] = useState('applicant');
  const [review, setReview] = useState({ status: REVIEW_STATUS.PENDING, comment: '' });
  const isReviewer = activeRole === 'company_reviewer';
  const isCommentRequired =
    review.status === REVIEW_STATUS.REJECTED || review.status === REVIEW_STATUS.NEEDS_CORRECTION;
  const currentMeta = REVIEW_STATUS_META[review.status];

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

      <Stack direction="row" spacing={1}>
        <Button
          variant={activeRole === 'applicant' ? 'contained' : 'outlined'}
          onClick={() => setActiveRole('applicant')}
        >
          حالت متقاضی
        </Button>
        <Button
          variant={activeRole === 'company_reviewer' ? 'contained' : 'outlined'}
          onClick={() => setActiveRole('company_reviewer')}
        >
          حالت شرکت
        </Button>
      </Stack>

      <fieldset disabled={isReviewer} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
        <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
          <Typography variant="body2">
            متقاضی/کارشناس می‌تواند با بارگذاری تصاویر ملک مورد تقاضا مطابقت بنا با ملک را تایید
            کند.
          </Typography>
        </Alert>

        <Typography variant="body2" textAlign="center" sx={{ mt: 5 }}>
          چهار عکس از زوایای مختلف به همراه اطلاعات متقاضی ملک
        </Typography>

        <Box
          sx={{
            mt: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            columnGap: 4,
            rowGap: 3,
          }}
        >
          <Box>
            <UploadBox
              name="survey.image_1"
              label="عکس 1 :"
              helperText="انتخاب فایل تصویر"
              accept="image/*"
            />
          </Box>
          <Box>
            <UploadBox
              name="survey.image_2"
              label="عکس 2 :"
              helperText="انتخاب فایل تصویر"
              accept="image/*"
            />
          </Box>
          <Box>
            <UploadBox
              name="survey.image_3"
              label="عکس 3 :"
              helperText="انتخاب فایل تصویر"
              accept="image/*"
            />
          </Box>
          <Box>
            <UploadBox
              name="survey.image_4"
              label="عکس 4 :"
              helperText="انتخاب فایل تصویر"
              accept="image/*"
            />
          </Box>
        </Box>

        {/* <Box sx={{ borderTop: '1px solid', borderColor: 'text.primary', mt: 1, pt: 1 }}>
          <Typography variant="body2" textAlign="center">
            نقشه به همراه اطلاعات توصیفی آن
          </Typography>
        </Box> */}

        <Alert severity="info" variant="outlined" sx={{ mt: 3 }}>
          <Typography variant="body2">
            نقشه و اطلاعات توصیفی آن باید با اسناد استنادی فایل سامانه مطابقت داشته باشد.
          </Typography>
        </Alert>

        <Box sx={{ maxWidth: 520, mt: 2 }}>
          <UploadBox
            name="survey.map_file"
            label="نقشه :"
            helperText="انتخاب فایل نقشه"
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </Box>

        <Controller
          name="survey.description"
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              fullWidth
              multiline
              rows={6}
              sx={{ mt: 2 }}
              label="توصیفات :"
              placeholder="توضیحات کامل وضعیت ملک، مشکلات احتمالی، مغایرت‌ها و سایر موارد مرتبط را ثبت کنید."
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
      </fieldset>

      {isReviewer ? (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            alignItems={{ md: 'center' }}
            sx={{ mb: 1 }}
          >
            <Typography variant="body2" fontWeight={700}>
              نتیجه بررسی نقشه‌برداری
            </Typography>
            <Chip
              label={currentMeta.label}
              color={currentMeta.color}
              size="small"
              variant="outlined"
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1.5 }}>
            <Button
              variant={review.status === REVIEW_STATUS.APPROVED ? 'contained' : 'outlined'}
              color="success"
              onClick={() => setReview((prev) => ({ ...prev, status: REVIEW_STATUS.APPROVED }))}
            >
              تایید
            </Button>
            <Button
              variant={review.status === REVIEW_STATUS.NEEDS_CORRECTION ? 'contained' : 'outlined'}
              color="info"
              onClick={() =>
                setReview((prev) => ({ ...prev, status: REVIEW_STATUS.NEEDS_CORRECTION }))
              }
            >
              نیاز به اصلاح
            </Button>
            <Button
              variant={review.status === REVIEW_STATUS.REJECTED ? 'contained' : 'outlined'}
              color="error"
              onClick={() => setReview((prev) => ({ ...prev, status: REVIEW_STATUS.REJECTED }))}
            >
              رد
            </Button>
          </Stack>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="توضیح کارشناس"
            value={review.comment}
            onChange={(event) => setReview((prev) => ({ ...prev, comment: event.target.value }))}
            error={isCommentRequired && !review.comment.trim()}
            helperText={
              isCommentRequired && !review.comment.trim()
                ? 'برای رد یا نیاز به اصلاح، ثبت توضیح الزامی است.'
                : 'در صورت نیاز توضیحات بررسی را ثبت کنید.'
            }
          />
        </Box>
      ) : (
        <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 2 }}>
          <Alert severity={currentMeta.severity} sx={{ mb: 1.25 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="body2" fontWeight={700}>
                نتیجه بررسی نقشه‌برداری
              </Typography>
              <Chip
                label={currentMeta.label}
                color={currentMeta.color}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="توضیح کارشناس"
            value={review.comment}
            InputProps={{ readOnly: true }}
            placeholder="هنوز توضیحی توسط کارشناس ثبت نشده است."
            helperText="در صورت ثبت توضیح توسط کارشناس، در این بخش نمایش داده می‌شود."
          />
        </Box>
      )}
    </Box>
  );
}
