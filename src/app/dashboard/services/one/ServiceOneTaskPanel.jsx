'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

import { isReviewElementId } from './service1-step-config';

import StaticPayment from './payment/WorkflowWizard';
import Page1Wizard from './page1/WorkflowWizard';
import Page2Wizard from './page2/WorkflowWizard';
import SurveyPaymentPage from './payment-survey/WorkflowWizard';
import RegistrationTrackingPage from './registration-tracking/WorkflowWizard';
import SurveyRegistrationTrackingPage from './survey-registration-tracking/WorkflowWizard';

function UserTaskFooter({ submitting, submitError, onSubmit }) {
  return (
    <Stack spacing={1} sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
      {submitError ? <Alert severity="error">{submitError}</Alert> : null}
      <Typography variant="caption" color="text.secondary">
        پس از تکمیل فرم بالا، ثبت مرحله در موتور را بزنید تا دکمهٔ «بعدی» در پایین صفحه فعال شود.
      </Typography>
      <Button variant="contained" disabled={submitting} onClick={() => onSubmit({})}>
        {submitting ? 'در حال ثبت…' : 'ثبت این مرحله در موتور'}
      </Button>
    </Stack>
  );
}

function ReviewTaskFooter({ submitting, submitError, onSubmit }) {
  return (
    <Stack spacing={1} sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
      {submitError ? <Alert severity="error">{submitError}</Alert> : null}
      <Typography variant="caption" color="text.secondary">
        پس از بررسی فرم بالا، نتیجه را در موتور ثبت کنید.
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button
          variant="contained"
          color="success"
          disabled={submitting}
          onClick={() => onSubmit({ approved: true })}
        >
          {submitting ? 'در حال ثبت…' : 'تایید بررسی'}
        </Button>
        <Button
          variant="outlined"
          color="error"
          disabled={submitting}
          onClick={() => onSubmit({ approved: false })}
        >
          رد / نیاز به اصلاح
        </Button>
      </Stack>
    </Stack>
  );
}

/**
 * همان UI فرم‌های ثابت پروژه؛ فقط داخل قالب تسک BPMN و با دکمهٔ ثبت جدا برای موتور.
 */
export default function ServiceOneTaskPanel({ task, onSubmitStepForm, submitting, submitError }) {
  const el = task?.element_id;
  const elKey = el == null ? '' : String(el).trim().toLowerCase();

  const formMethods = useForm({
    defaultValues: {
      registrationTracking: { sentTrackingCode: '' },
      surveyRegistrationTracking: { sentTrackingCode: '' },
    },
  });

  if (!el) {
    return <Alert severity="info">تسک فعالی برای نمایش نیست.</Alert>;
  }

  const isReview = isReviewElementId(elKey);

  let inner = null;
  switch (elKey) {
    case 'payment':
      inner = <StaticPayment />;
      break;
    case 'form1':
      inner = <Page1Wizard />;
      break;
    case 'review1':
      inner = <RegistrationTrackingPage />;
      break;
    case 'enterCode':
      inner = <SurveyPaymentPage />;
      break;
    case 'form2':
      inner = <Page2Wizard />;
      break;
    case 'review2':
      inner = <SurveyRegistrationTrackingPage />;
      break;
    default:
      inner = (
        <Alert severity="warning">
          مرحلهٔ BPMN شناخته‌شده نیست: <strong>{elKey || el}</strong>
        </Alert>
      );
  }

  return (
    <FormProvider {...formMethods}>
      <Box>
        {inner}
        {isReview ? (
          <ReviewTaskFooter submitting={submitting} submitError={submitError} onSubmit={onSubmitStepForm} />
        ) : (
          <UserTaskFooter submitting={submitting} submitError={submitError} onSubmit={onSubmitStepForm} />
        )}
      </Box>
    </FormProvider>
  );
}
