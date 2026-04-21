'use client';

import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  NoSsr,
  Popover,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Field } from 'src/components/hook-form';

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

const ACTION_TYPE_OPTIONS = [
  'طرح دعوا در مراجع قضایی',
  'ثبت اولیه',
  'طرح تقاضا در هیئت سامان دهی',
  'طرح تقاضا در هیئت تعیین تکلیف',
];

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

function InfoHint({ text }) {
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <>
      <IconButton size="small" color="info" onClick={(event) => setAnchorEl(event.currentTarget)}>
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Typography variant="body2" sx={{ p: 1.5, maxWidth: 320, lineHeight: 1.7 }}>
          {text}
        </Typography>
      </Popover>
    </>
  );
}

export default function WorkflowWizardPage2() {
  const [activeRole, setActiveRole] = useState('applicant');
  const [isRegistryInfoModalOpen, setIsRegistryInfoModalOpen] = useState(false);
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
        درج گواهی اقدام
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
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setIsRegistryInfoModalOpen(true)}
          >
            مشاهده اطلاعات ارسال شده از طرف سازمان ثبت
          </Button>
        </Box>

        {/* <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
          <Typography variant="body2">
            اقلام این بخش بر اساس فرم مصوب استخراج شده‌اند. لطفا اطلاعات را مطابق توضیحات هر فیلد
            تکمیل کنید.
          </Typography>
        </Alert> */}

        <Box sx={{ mt: 3, display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Controller
              name="action.confirm_claim_info"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="آیا اطلاعات ادعای درج‌شده مورد تایید متقاضی است؟"
                  error={!!error}
                  helperText={error?.message}
                >
                  <MenuItem value="yes">بلی</MenuItem>
                  <MenuItem value="no">خیر</MenuItem>
                </TextField>
              )}
            />
            <InfoHint text="اجباری - فرمت مقدار: بلی/خیر. در صورت عدم تایید، اعلام اطلاعات پایه از سازمان ارسال می‌شود." />
          </Box>
        </Box>

        {/* <Alert severity="info" variant="outlined" sx={{ mt: 3, mb: 2 }}>
          <Typography variant="body2">
            ردیف‌های بعدی مطابق جدول اقدام، برای ثبت جزئیات گواهی و مستندات تکمیل شوند.
          </Typography>
        </Alert> */}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            columnGap: 3,
            rowGap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <NoSsr>
              <Field.DatePicker
                name="action.certificate_issue_date"
                label="تاریخ صدور گواهی اقدام"
                slotProps={{ textField: { fullWidth: true } }}
              />
            </NoSsr>
            <InfoHint text="اجباری" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Controller
              name="action.unique_certificate_id"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="شناسه یکتا گواهی اقدام"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
            <InfoHint text="اختیاری" />
          </Box>

          <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Controller
                name="action.action_type"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="نوع اقدام"
                    error={!!error}
                    helperText={error?.message}
                  >
                    {ACTION_TYPE_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>
          </Box>

          <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 1' } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ width: '100%' }}>
                <UploadBox
                  name="action.certificate_image"
                  label="تصویر گواهی اقدام"
                  helperText="تصویر یا فایل گواهی اقدام را بارگذاری کنید"
                  accept="image/*,.pdf"
                />
              </Box>
              <InfoHint text="اجباری" />
            </Box>
          </Box>
        </Box>
      </fieldset>

      <Dialog
        open={isRegistryInfoModalOpen}
        onClose={() => setIsRegistryInfoModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>اطلاعات ارسال شده از طرف سازمان ثبت</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                تاریخ درج ادعا
              </Typography>
              <Typography variant="body2" color="text.secondary">
                -
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                کد رهگیری ادعا
              </Typography>
              <Typography variant="body2" color="text.secondary">
                -
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                مشخصات اصلی ادعا
              </Typography>
              <Typography variant="body2" color="text.secondary">
                -
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsRegistryInfoModalOpen(false)}>بستن</Button>
        </DialogActions>
      </Dialog>

      {isReviewer ? (
        <Box
          sx={{
            mt: 20,
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 2.5,
            p: 2.5,
            bgcolor: 'background.paper',
            boxShadow: (theme) => theme.shadows[2],
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            alignItems={{ md: 'center' }}
            sx={{ mb: 1 }}
          >
            <Typography variant="body2" fontWeight={700}>
              نتیجه بررسی فرم
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
        <Box
          sx={{
            mt: 20,
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 2.5,
            p: 2.5,
            bgcolor: 'grey.50',
            boxShadow: (theme) => theme.shadows[1],
          }}
        >
          <Alert severity={currentMeta.severity} sx={{ mb: 1.25 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="body2" fontWeight={700}>
                نتیجه بررسی فرم
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
