'use client';

import React, { useState } from 'react';
import { Alert, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';

import BoundaryAnnouncementPage from '../boundary-announcement/WorkflowWizard';
import DocumentDeliveryPage from '../document-delivery/WorkflowWizard';
import LandOwnerFeePaymentPage from '../land-owner-fee-payment/WorkflowWizard';

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

const defaultReview = () => ({ status: REVIEW_STATUS.PENDING, comment: '' });

export default function WorkflowWizardPage2({
  taskKind = 'form2',
  review: reviewProp,
  setReview: setReviewProp,
  isVillageProperty = false,
  landOwnerFeeAmount = '',
  landOwnerFeeSheba = '',
  onEngineStepSubmit,
  engineSubmitting = false,
  finalSubmitDisabled = false,
} = {}) {
  const [internalReview, setInternalReview] = useState(defaultReview);
  const review = reviewProp !== undefined ? reviewProp : internalReview;
  const setReview = setReviewProp ?? setInternalReview;
  const isReviewer = taskKind === 'centralReviewForm2';
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
        {isReviewer ? 'بررسی اطلاعات مرحله صدور سند' : 'دریافت هزینه صدور سند و آگهی تحدید حدود'}
      </Typography>

      <fieldset disabled={isReviewer} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
        <Stack spacing={3}>
          <LandOwnerFeePaymentPage landOwnerFeeAmount={landOwnerFeeAmount} sheba={landOwnerFeeSheba} />
          <BoundaryAnnouncementPage isVillageProperty={isVillageProperty} />
          <DocumentDeliveryPage />
        </Stack>
      </fieldset>

      {isReviewer ? (
        <Box
          sx={{
            mt: 2,
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
            <Chip label={currentMeta.label} color={currentMeta.color} size="small" variant="outlined" />
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
              onClick={() => setReview((prev) => ({ ...prev, status: REVIEW_STATUS.NEEDS_CORRECTION }))}
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
            mt: 2,
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
              <Chip label={currentMeta.label} color={currentMeta.color} size="small" variant="outlined" />
            </Stack>
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="توضیح کارشناس"
            value={reviewerComment}
            InputProps={{ readOnly: true }}
          />
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
