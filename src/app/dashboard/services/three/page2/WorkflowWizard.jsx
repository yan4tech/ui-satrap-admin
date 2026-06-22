'use client';

import React, { useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
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
import { RHFUploadBox } from 'src/components/hook-form/rhf-upload-box';

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

const PROPERTY_TYPE_OPTIONS = ['زمین', 'آپارتمان', 'ویلایی', 'سایر'];
const PROPERTY_USAGE_OPTIONS = ['مسکونی', 'تجاری', 'اداری', 'کشاورزی', 'سایر'];
const CLAIM_TYPE_OPTIONS = ['مالکیت عین', 'حق ارتفاق', 'حق انتفاع', 'مالکیت منافع'];
const CLAIM_OWNERSHIP_OPTIONS = ['عرصه', 'اعیان', 'عرصه و اعیان', 'سهم و اعیان'];
const DOCUMENT_TYPE_OPTIONS = [
  'پاسخ مبایعه نامه',
  'صلح نامه',
  'قولنامه',
  'تقسیم‌نامه',
  'هبه نامه',
  'آراء محاکم',
  'سندهای زراعی',
  'استشهادیه',
  'گواهی حصر وراثت',
  'سایر',
];

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

const defaultReview = () => ({ status: REVIEW_STATUS.PENDING, comment: '' });

export default function WorkflowWizardPage2({
  taskKind = 'form2',
  review: reviewProp,
  setReview: setReviewProp,
  onEngineStepSubmit,
  engineSubmitting = false,
  finalSubmitDisabled = false,
} = {}) {
  const { control } = useFormContext();
  const [isRegistryInfoModalOpen, setIsRegistryInfoModalOpen] = useState(false);
  const [internalReview, setInternalReview] = useState(defaultReview);
  const review = reviewProp !== undefined ? reviewProp : internalReview;
  const setReview = setReviewProp ?? setInternalReview;
  const isReviewer = taskKind === 'centralReviewForm2';
  const claimOwnershipType = useWatch({ control, name: 'action.claim_ownership_type' });
  const isJointOwnership = claimOwnershipType?.includes('سهم');
  const isCommentRequired =
    review.status === REVIEW_STATUS.REJECTED || review.status === REVIEW_STATUS.NEEDS_CORRECTION;
  const currentMeta = REVIEW_STATUS_META[review.status];
  const reviewerComment = (review.comment || '').trim();

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
        {isReviewer ? 'تایید نقشه برداری' : 'گواهی اقدام'}
      </Typography>

      <Box sx={{ position: 'relative' }}>
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
          <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
            <Typography variant="subtitle2" fontWeight={700}>
              اطلاعات ملک
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Controller
              name="action.property_type"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="نوع ملک"
                  error={!!error}
                  helperText={error?.message}
                >
                  {PROPERTY_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <InfoHint text="اجباری - اطلاعات پایه (زمین/آپارتمان/ویلایی/...)" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Controller
              name="action.property_usage"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="کاربری ملک"
                  error={!!error}
                  helperText={error?.message}
                >
                  {PROPERTY_USAGE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <InfoHint text="اجباری - اطلاعات پایه (مسکونی/تجاری/اداری/کشاورزی/...)" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Controller
              name="action.main_plaque_number"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="پلاک ثبتی اصلی"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
            <InfoHint text="اختیاری" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Controller
              name="action.sub_plaque_number"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="پلاک ثبتی فرعی"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
            <InfoHint text="اختیاری" />
          </Box>

          <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' }, mt: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              اطلاعات حقوقی ادعا شده بر روی ملک
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Controller
              name="action.claim_type"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="نوع ادعا"
                  error={!!error}
                  helperText={error?.message}
                >
                  {CLAIM_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <InfoHint text="اجباری - اطلاعات پایه (مالکیت عین/حق ارتفاق/حق انتفاع/مالکیت منافع)" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Controller
              name="action.claim_ownership_type"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="نوع مالکیت مورد ادعا"
                  error={!!error}
                  helperText={error?.message}
                >
                  {CLAIM_OWNERSHIP_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <InfoHint text="اجباری - اطلاعات پایه (عرصه/اعیان/عرصه و اعیان/سهم و اعیان)" />
          </Box>

          {isJointOwnership ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <Controller
                  name="action.total_share_count"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="تعداد سهم کل"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
                <InfoHint text="اجباری" />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <Controller
                  name="action.partial_share_count"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="تعداد سهم جزء"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
                <InfoHint text="اجباری" />
              </Box>
            </>
          ) : null}

          <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' }, mt: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              اطلاعات مستندات ادعا
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Controller
              name="action.document_type"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="نوع مستند"
                  error={!!error}
                  helperText={error?.message}
                >
                  {DOCUMENT_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <InfoHint text="اجباری" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Controller
              name="action.document_number"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="شماره سند"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
            <InfoHint text="اختیاری" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <NoSsr>
              <Field.DatePicker
                name="action.document_issue_date"
                label="تاریخ تنظیم سند"
                slotProps={{ textField: { fullWidth: true } }}
              />
            </NoSsr>
            <InfoHint text="اختیاری" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Box sx={{ width: '100%' }}>
              <RHFUploadBox
                name="action.document_image"
                label="تصویر سند"
                helperText="تصویر یا فایل مستند ادعا را بارگذاری کنید"
                accept="image/*,.pdf"
              />
            </Box>
            <InfoHint text="اجباری" />
          </Box>
          </Box>
        </fieldset>

        {isReviewer ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              bgcolor: 'transparent',
              cursor: 'not-allowed',
            }}
          />
        ) : null}
      </Box>

      <Dialog
        open={isRegistryInfoModalOpen}
        onClose={() => setIsRegistryInfoModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>اطلاعات ارسال شده از طرف سازمان ثبت</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Box sx={{ width: '100%' }}>
                <RHFUploadBox
                  name="action.document_image"
                  label="تصویر سند"
                  accept="image/*,.pdf"
                />
              </Box>
              <InfoHint text="اجباری" />
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
      ) : reviewerComment ? (
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
          {reviewerComment ? (
            <TextField
              fullWidth
              multiline
              rows={2}
              label="توضیح کارشناس"
              value={reviewerComment}
              InputProps={{ readOnly: true }}
            />
          ) : null}
        </Box>
      ) : null}
      {isReviewer && typeof onEngineStepSubmit === 'function' ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            type="button"
            variant="contained"
            color="success"
            disabled={
              engineSubmitting ||
              finalSubmitDisabled ||
              review.status === REVIEW_STATUS.PENDING ||
              ((review.status === REVIEW_STATUS.REJECTED ||
                review.status === REVIEW_STATUS.NEEDS_CORRECTION) &&
                !review.comment.trim())
            }
            onClick={async () => {
              const comment = (review.comment || '').trim();
              if (review.status === REVIEW_STATUS.APPROVED) {
                await onEngineStepSubmit({
                  engineReviewDecision: 'approved',
                  review_comment: comment || 'ok',
                });
              } else if (review.status === REVIEW_STATUS.NEEDS_CORRECTION) {
                await onEngineStepSubmit({
                  engineReviewDecision: 'correction',
                  comment,
                });
              } else if (review.status === REVIEW_STATUS.REJECTED) {
                await onEngineStepSubmit({
                  engineReviewDecision: 'rejected',
                  comment,
                });
              }
            }}
          >
            {engineSubmitting ? 'در حال ثبت…' : 'ثبت نهایی'}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
