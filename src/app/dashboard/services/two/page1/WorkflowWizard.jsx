'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Card,
  CardContent,
  Button,
  Box,
  Typography,
  Container,
  Divider,
  Stack,
  Chip,
  TextField,
  Alert,
} from '@mui/material';

import Step0 from './steps/Step0';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import Step4 from './steps/Step4';
import Step5 from './steps/Step5';

const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_CORRECTION: 'needs_correction',
};

const REVIEW_STATUS_META = {
  [REVIEW_STATUS.PENDING]: { label: 'در انتظار بررسی', color: 'warning' },
  [REVIEW_STATUS.APPROVED]: { label: 'تایید شد', color: 'success' },
  [REVIEW_STATUS.REJECTED]: { label: 'رد شد', color: 'error' },
  [REVIEW_STATUS.NEEDS_CORRECTION]: { label: 'نیاز به اصلاح', color: 'info' },
};

const FORM_SECTIONS = [
  { key: 'step0', title: 'اطلاعات شخصی', Component: Step0 },
  { key: 'step1', title: 'اطلاعات ادعا', Component: Step1 },
  // { key: 'step2', title: 'اطلاعات مکانی', Component: Step2 },
  // { key: 'step3', title: 'اطلاعات ملک', Component: Step3 },
  // { key: 'step4', title: 'دسترسی به دیگران', Component: Step4 },
];

function ReviewDecisionCard({ review, isReviewer, onStatusChange, onCommentChange }) {
  if (!isReviewer) return null;

  const currentMeta = REVIEW_STATUS_META[review.status];
  const isCommentRequired =
    review.status === REVIEW_STATUS.REJECTED || review.status === REVIEW_STATUS.NEEDS_CORRECTION;

  return (
    <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
        <Typography variant="body2" fontWeight={700}>
          نتیجه بررسی کل فرم
        </Typography>
        <Chip
          label={currentMeta.label}
          color={currentMeta.color}
          size="small"
          variant={review.status === REVIEW_STATUS.PENDING ? 'outlined' : 'filled'}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
        <Button
          variant={review.status === REVIEW_STATUS.APPROVED ? 'contained' : 'outlined'}
          color="success"
          onClick={() => onStatusChange(REVIEW_STATUS.APPROVED)}
        >
          تایید
        </Button>
        <Button
          variant={review.status === REVIEW_STATUS.NEEDS_CORRECTION ? 'contained' : 'outlined'}
          color="info"
          onClick={() => onStatusChange(REVIEW_STATUS.NEEDS_CORRECTION)}
        >
          نیاز به اصلاح
        </Button>
        <Button
          variant={review.status === REVIEW_STATUS.REJECTED ? 'contained' : 'outlined'}
          color="error"
          onClick={() => onStatusChange(REVIEW_STATUS.REJECTED)}
        >
          رد
        </Button>
      </Stack>

      <TextField
        fullWidth
        multiline
        rows={2}
        label="توضیح کارشناس"
        sx={{ mt: 1.5 }}
        value={review.comment}
        onChange={(event) => onCommentChange(event.target.value)}
        error={isCommentRequired && !review.comment.trim()}
        helperText={
          isCommentRequired && !review.comment.trim()
            ? 'برای رد یا نیاز به اصلاح، ثبت توضیح الزامی است.'
            : 'در صورت نیاز توضیحات را ثبت کنید.'
        }
      />
    </Box>
  );
}

function ApplicantReviewFeedback({ review, isReviewer }) {
  if (isReviewer) return null;

  const currentMeta = REVIEW_STATUS_META[review.status];
  const statusToSeverity = {
    [REVIEW_STATUS.PENDING]: 'warning',
    [REVIEW_STATUS.APPROVED]: 'success',
    [REVIEW_STATUS.REJECTED]: 'error',
    [REVIEW_STATUS.NEEDS_CORRECTION]: 'info',
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
      <Alert severity={statusToSeverity[review.status]} sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="body2" fontWeight={700}>
            نتیجه بررسی کل فرم
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
        helperText={
          review.status === REVIEW_STATUS.PENDING
            ? 'این مرحله هنوز توسط شرکت بررسی نشده است.'
            : 'در صورت ثبت توضیح توسط کارشناس، در این بخش نمایش داده می‌شود.'
        }
      />
    </Box>
  );
}

export default function WorkflowWizard() {
  const [activeRole, setActiveRole] = useState('applicant');
  const [workflowStatus, setWorkflowStatus] = useState('draft');
  const [review, setReview] = useState({ status: REVIEW_STATUS.PENDING, comment: '' });

  const methods = useForm({
    resolver: zodResolver(z.object({})),
    mode: 'onChange',
    defaultValues: {
      request_type: 2,
      contract_number: '',
      contract_date: '',
      service_type: 2,
      request_description: '',

      applicant_name: '',
      applicant_family: '',
      national_id: '',
      mobile: '',
      sana_registration_status: '',
      is_claimant_deceased: 'no',
      claim_registration_tracking_code: '',
      deceased_national_id: '',
      deceased_date: '',
      legal_entity_national_id: '',
      representation_method: '',
      national_id_asil: '',
      representation_doc_date: '',
      representation_doc_id: '',
      verification_code: '',
      representation_doc_image: null,
      legal_expert_national_id: '',
      expert_representation_result: '',
      expert_description: '',
      email: '',
      address: '',

      total_amount: 0,
      discount: 0,
      final_amount: 0,
      extra_description: '',
      attachment: '',
      has_map_access_request: 'no',
      access_people: [],
    },
  });

  const { handleSubmit, watch, setValue } = methods;

  // ---------------- CALC FINAL AMOUNT ----------------
  const total = watch('total_amount') || 0;
  const discount = watch('discount') || 0;

  useEffect(() => {
    setValue('final_amount', Math.max(0, total - discount));
  }, [total, discount, setValue]);

  const isReviewer = activeRole === 'company_reviewer';

  const canFinalizeReview = useMemo(() => {
    if (!isReviewer) return false;

    if (review.status === REVIEW_STATUS.REJECTED || review.status === REVIEW_STATUS.NEEDS_CORRECTION) {
      return Boolean(review.comment.trim());
    }
    return review.status !== REVIEW_STATUS.PENDING;
  }, [isReviewer, review]);

  const handleReviewStatusChange = (status) => {
    setReview((prev) => ({
      ...prev,
      status,
    }));
  };

  const handleReviewCommentChange = (comment) => {
    setReview((prev) => ({
      ...prev,
      comment,
    }));
  };

  const handleFinalizeReview = () => {
    if (!canFinalizeReview) return;

    const hasCorrection =
      review.status === REVIEW_STATUS.REJECTED || review.status === REVIEW_STATUS.NEEDS_CORRECTION;
    setWorkflowStatus(hasCorrection ? 'returned_for_edit' : 'approved');
    alert(hasCorrection ? 'درخواست برای اصلاح برگشت داده شد.' : 'درخواست توسط شرکت تایید شد.');
  };

  // ---------------- SUBMIT ----------------
  const onSubmit = (data) => {
    if (isReviewer) {
      return;
    }

    console.log('SUBMITTED BY APPLICANT:', data);
    setWorkflowStatus('submitted_by_user');
    alert('درخواست با موفقیت ثبت و برای بررسی شرکت ارسال شد.');
  };

  return (
    <Container maxWidth="lg" dir="rtl" sx={{ py: 3 }}>
      <Card
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'text.primary',
          boxShadow: (theme) => theme.shadows[2],
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h5" textAlign="center" mb={3}>
            {isReviewer
              ? 'بررسی و تایید اطلاعات متقاضی توسط شرکت'
              : 'تکمیل فرم درخواست اولیه توسط متقاضی'}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
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

          <Chip
            label={`وضعیت پرونده: ${workflowStatus}`}
            color={
              workflowStatus === 'approved'
                ? 'success'
                : workflowStatus === 'returned_for_edit'
                  ? 'warning'
                  : 'default'
            }
            variant="outlined"
            sx={{ mb: 3 }}
          />

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ minHeight: 250, display: 'grid', gap: 4 }}>
                {FORM_SECTIONS.map((step, index) => (
                  <React.Fragment key={step.key}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                      <Typography variant="subtitle1" fontWeight={700} mb={2}>
                        {step.title}
                      </Typography>

                      <fieldset
                        disabled={isReviewer}
                        style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
                      >
                        <step.Component />
                      </fieldset>

                    </Box>
                    {index < FORM_SECTIONS.length - 1 ? <Divider /> : null}
                  </React.Fragment>
                ))}

                {isReviewer ? (
                  <>
                    <Divider />
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                      <Typography variant="subtitle1" fontWeight={700} mb={2}>
                        تخصیص کارشناس نقشه برداری
                      </Typography>
                      <Step5 />
                    </Box>
                  </>
                ) : null}

                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    p: 2,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    نتیجه بررسی کل فرم
                  </Typography>

                  <ReviewDecisionCard
                    review={review}
                    isReviewer={isReviewer}
                    onStatusChange={handleReviewStatusChange}
                    onCommentChange={handleReviewCommentChange}
                  />

                  <ApplicantReviewFeedback review={review} isReviewer={isReviewer} />
                </Box>
              </Box>

              {isReviewer ? (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                  <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    sx={{ minWidth: 220 }}
                    disabled={!canFinalizeReview}
                    onClick={handleFinalizeReview}
                  >
                    ثبت نتیجه نهایی بررسی
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                  <Button type="submit" variant="contained" color="success" sx={{ minWidth: 140 }}>
                    ثبت نهایی
                  </Button>
                </Box>
              )}
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </Container>
  );
}
