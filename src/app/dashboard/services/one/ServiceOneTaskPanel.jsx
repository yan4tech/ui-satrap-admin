'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

import {
  buildForm1ReviewStateFromTasksMap,
  buildForm2ReviewStateFromTasksMap,
  sanitizeValuesForEngineJson,
} from './engine-api';
import { isReviewElementId } from './service1-step-config';

import StaticPayment from './payment/WorkflowWizard';
import Page1Wizard from './page1/WorkflowWizard';
import Page2Wizard from './page2/WorkflowWizard';
import EnterCodeStep from './EnterCodeStep';

function UserTaskFooter({ submitting, submitError, onSubmit }) {
  return (
    <Stack spacing={1} sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
      {submitError ? <Alert severity="error">{submitError}</Alert> : null}
      <Typography variant="caption" color="text.secondary">
        پس از تکمیل فرم بالا، ثبت مرحله در موتور را بزنید تا دکمهٔ «بعدی» در پایین صفحه فعال شود.
      </Typography>
      <Button variant="contained" disabled={submitting} onClick={() => void onSubmit()}>
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
          onClick={() => void onSubmit({ approved: true })}
        >
          {submitting ? 'در حال ثبت…' : 'تایید بررسی'}
        </Button>
        <Button
          variant="outlined"
          color="error"
          disabled={submitting}
          onClick={() => void onSubmit({ approved: false })}
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
const initialFormReview = () => ({ status: 'pending', comment: '' });

export default function ServiceOneTaskPanel({
  task,
  tasksIdMap,
  reviewHydrationKey,
  onSubmitStepForm,
  submitting,
  submitError,
  interactionLocked = false,
  waitForOtherUser = false,
}) {
  const el = task?.element_id;
  const elKey = el == null ? '' : String(el).trim().toLowerCase();

  const [form1Review, setForm1Review] = useState(initialFormReview);
  const [form2Review, setForm2Review] = useState(initialFormReview);
  const lastHydratedReview1TaskId = useRef(null);
  const lastHydratedCentral2TaskId = useRef(null);

  useEffect(() => {
    lastHydratedReview1TaskId.current = null;
    lastHydratedCentral2TaskId.current = null;
  }, [reviewHydrationKey]);

  useEffect(() => {
    const map = tasksIdMap && typeof tasksIdMap === 'object' ? tasksIdMap : null;
    if (!map) return;

    if (elKey === 'form1') {
      setForm1Review(buildForm1ReviewStateFromTasksMap(map));
      return;
    }
    if (elKey === 'review1' && task?.ID != null) {
      if (lastHydratedReview1TaskId.current !== task.ID) {
        lastHydratedReview1TaskId.current = task.ID;
        setForm1Review(buildForm1ReviewStateFromTasksMap(map));
      }
    }
  }, [elKey, task?.ID, tasksIdMap]);

  useEffect(() => {
    const map = tasksIdMap && typeof tasksIdMap === 'object' ? tasksIdMap : null;
    if (!map) return;

    if (elKey === 'form2') {
      setForm2Review(buildForm2ReviewStateFromTasksMap(map));
      return;
    }
    if ((elKey === 'centralreviewform2' || elKey === 'review2') && task?.ID != null) {
      if (lastHydratedCentral2TaskId.current !== task.ID) {
        lastHydratedCentral2TaskId.current = task.ID;
        setForm2Review(buildForm2ReviewStateFromTasksMap(map));
      }
    }
  }, [elKey, task?.ID, tasksIdMap]);

  const formMethods = useForm({
    defaultValues: {
      registrationTracking: { sentTrackingCode: '' },
      surveyRegistrationTracking: { sentTrackingCode: '' },
      survey: {
        image_1: null,
        image_2: null,
        image_3: null,
        image_4: null,
        map_file: null,
        description: '',
      },
    },
  });

  const submitWithFormValues = useCallback(
    async (extra = {}) => {
      const values = sanitizeValuesForEngineJson(formMethods.getValues());
      return onSubmitStepForm({ ...values, ...(extra || {}) });
    },
    [formMethods, onSubmitStepForm]
  );

  if (!el) {
    return <Alert severity="info">تسک فعالی برای نمایش نیست.</Alert>;
  }

  const isReview = isReviewElementId(elKey);
  /** فوتر دکمه‌های «تایید بررسی / رد» فقط برای مراحلی غیر از تایید اطلاعات اولیه و تایید نقشه برداری */
  const showOuterReviewFooter =
    isReview && elKey !== 'review1' && elKey !== 'centralreviewform2' && elKey !== 'review2';
  /** ورود کد پیامک فوتر اختصاصی داخل همان کامپوننت دارد */
  const hideOuterUserFooter = elKey === 'entercode';

  const engineReviewProps = {
    onEngineStepSubmit: onSubmitStepForm,
    engineSubmitting: submitting,
    engineSubmitError: submitError,
  };

  let inner = null;
  switch (elKey) {
    case 'payment':
    case 'payment1':
    case 'paymentsurvey':
      inner = <StaticPayment />;
      break;
    case 'form1':
      inner = (
        <Page1Wizard
          taskKind="form1"
          review={form1Review}
          setReview={setForm1Review}
          formMethods={formMethods}
        />
      );
      break;
    case 'review1':
      inner = (
        <Page1Wizard
          taskKind="review1"
          review={form1Review}
          setReview={setForm1Review}
          formMethods={formMethods}
          {...engineReviewProps}
        />
      );
      break;
    case 'entercode':
      inner = (
        <EnterCodeStep
          onEngineSubmit={onSubmitStepForm}
          engineSubmitting={submitting}
          engineSubmitError={submitError}
        />
      );
      break;
    case 'form2':
      inner = (
        <Page2Wizard taskKind="form2" review={form2Review} setReview={setForm2Review} />
      );
      break;
    case 'centralreviewform2':
      inner = (
        <Page2Wizard
          taskKind="centralReviewForm2"
          review={form2Review}
          setReview={setForm2Review}
          {...engineReviewProps}
        />
      );
      break;
    case 'review2':
      inner = (
        <Page2Wizard
          taskKind="centralReviewForm2"
          review={form2Review}
          setReview={setForm2Review}
          {...engineReviewProps}
        />
      );
      break;
    default:
      inner = (
        <Alert severity="warning">
          مرحلهٔ BPMN شناخته‌شده نیست: <strong>{elKey || el}</strong>
        </Alert>
      );
  }

  const bodyLocked = interactionLocked || waitForOtherUser;

  return (
    <FormProvider {...formMethods}>
      <Box sx={bodyLocked ? { pointerEvents: 'none', opacity: 0.72 } : undefined}>
        {waitForOtherUser && !interactionLocked ? (
          <Alert severity="warning" sx={{ mb: 2 }} variant="outlined">
            <Typography variant="body2">
              این مرحله را کاربر دیگری (مثلاً شعبه یا شرکت) در سامانه انجام می‌دهد؛ تا آن زمان فرم
              و دکمهٔ ثبت غیرفعال است.
            </Typography>
          </Alert>
        ) : null}
        {inner}
        {!bodyLocked &&
          (showOuterReviewFooter ? (
            <ReviewTaskFooter
              submitting={submitting}
              submitError={submitError}
              onSubmit={submitWithFormValues}
            />
          ) : isReview || hideOuterUserFooter ? null : (
            <UserTaskFooter
              submitting={submitting}
              submitError={submitError}
              onSubmit={submitWithFormValues}
            />
          ))}
      </Box>
    </FormProvider>
  );
}
