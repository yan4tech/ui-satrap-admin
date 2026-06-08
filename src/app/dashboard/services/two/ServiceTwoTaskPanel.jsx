'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

import {
  buildForm1ReviewStateFromTasksMap,
  buildForm2ReviewStateFromTasksMap,
  sanitizeValuesForEngineJson,
} from '../one/engine-api';
import { isReviewElementId } from '../one/service1-step-config';

import StaticPayment from './payment/WorkflowWizard';
import Page1Wizard from './page1/WorkflowWizard';
import Page2Wizard from './page2/WorkflowWizard';
import RegistrationTrackingPage from './registration-tracking/WorkflowWizard';
import EnterCodeStep from '../one/EnterCodeStep';

function asObject(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function getFormAttachKeyByElementId(elKey) {
  if (elKey === 'form1' || elKey === 'review1') return 'form1';
  if (elKey === 'form2' || elKey === 'review2' || elKey === 'centralreviewform2') return 'form2';
  if (elKey === 'tracking' || elKey === 'registrationtracking') return 'registrationTracking';
  if (elKey === 'entercode') return 'enterCode';
  return null;
}

function isTaskAlreadyComplete(task) {
  if (!task || typeof task !== 'object') return false;
  if (
    task.is_complete === true ||
    task.isComplete === true ||
    task.completed === true ||
    task.IsComplete === true
  ) {
    return true;
  }
  const status = String(task.status ?? task.task_status ?? '')
    .trim()
    .toUpperCase();
  return status === 'DONE' || status === 'COMPLETED' || status === 'COMPLETE' || status === 'FINISHED';
}

function pickHydrationPayloadFromAttachedData(attachedData, attachKey) {
  const ad = asObject(attachedData);
  if (!ad || !attachKey) return null;
  const form = asObject(ad.form);
  const previous = asObject(ad.previous_submission);
  const payload = asObject(ad.payload);
  const data = asObject(ad.data);
  const submission = asObject(ad.submission);

  const direct = asObject(ad[attachKey]);
  if (direct) return direct;
  const fromFormByKey = asObject(form?.[attachKey]);
  if (fromFormByKey) return fromFormByKey;
  const fromPreviousByKey = asObject(previous?.[attachKey]);
  if (fromPreviousByKey) return fromPreviousByKey;
  const fromPayloadByKey = asObject(payload?.[attachKey]);
  if (fromPayloadByKey) return fromPayloadByKey;
  const fromDataByKey = asObject(data?.[attachKey]);
  if (fromDataByKey) return fromDataByKey;
  const fromSubmissionByKey = asObject(submission?.[attachKey]);
  if (fromSubmissionByKey) return fromSubmissionByKey;

  const flatForm = asObject(form);
  if (flatForm && !flatForm[attachKey] && (attachKey === 'form1' || attachKey === 'form2')) {
    return flatForm;
  }
  const flatPrevious = asObject(previous);
  if (flatPrevious && !flatPrevious[attachKey] && (attachKey === 'form1' || attachKey === 'form2')) {
    return flatPrevious;
  }
  return null;
}

function UserTaskFooter({ submitting, submitError, onSubmit, finalSubmitDisabled = false }) {
  return (
    <Stack spacing={1} sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
      {submitError ? <Alert severity="error">{submitError}</Alert> : null}
      <Typography variant="caption" color="text.secondary">
        پس از تکمیل فرم بالا، «ثبت نهایی» را بزنید تا دکمهٔ «بعدی» در پایین صفحه فعال شود.
      </Typography>
      <Button variant="contained" color="success" disabled={submitting || finalSubmitDisabled} onClick={() => void onSubmit()}>
        {submitting ? 'در حال ثبت…' : 'ثبت نهایی'}
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
        <Button variant="contained" color="success" disabled={submitting} onClick={() => void onSubmit({ approved: true })}>
          {submitting ? 'در حال ثبت…' : 'تایید بررسی'}
        </Button>
        <Button variant="outlined" color="error" disabled={submitting} onClick={() => void onSubmit({ approved: false })}>
          رد / نیاز به اصلاح
        </Button>
      </Stack>
    </Stack>
  );
}

const initialFormReview = () => ({ status: 'pending', comment: '' });

export default function ServiceTwoTaskPanel(props) {
  const {
    task,
    tasksIdMap,
    processInstanceId = null,
    reviewHydrationKey,
    onSubmitStepForm,
    submitting,
    submitError,
    interactionLocked = false,
    waitForOtherUser = false,
    finalSubmitDisabled = false,
  } = props;

  const el = task?.element_id;
  const elKey = el == null ? '' : String(el).trim().toLowerCase();
  const [form1Review, setForm1Review] = useState(initialFormReview);
  const [form2Review, setForm2Review] = useState(initialFormReview);
  const lastHydratedReview1TaskId = useRef(null);
  const lastHydratedCentral2TaskId = useRef(null);
  const lastHydratedFormTaskId = useRef(null);

  useEffect(() => {
    lastHydratedReview1TaskId.current = null;
    lastHydratedCentral2TaskId.current = null;
    lastHydratedFormTaskId.current = null;
  }, [reviewHydrationKey]);

  useEffect(() => {
    const map = tasksIdMap && typeof tasksIdMap === 'object' ? tasksIdMap : null;
    if (!map) return;
    if (elKey === 'form1') return void setForm1Review(buildForm1ReviewStateFromTasksMap(map, { activeTask: task }));
    if (elKey === 'review1' && task?.ID != null && lastHydratedReview1TaskId.current !== task.ID) {
      lastHydratedReview1TaskId.current = task.ID;
      setForm1Review(buildForm1ReviewStateFromTasksMap(map, { activeTask: task }));
    }
  }, [elKey, task?.ID, tasksIdMap]);

  useEffect(() => {
    const map = tasksIdMap && typeof tasksIdMap === 'object' ? tasksIdMap : null;
    if (!map) return;
    if (elKey === 'form2') return void setForm2Review(buildForm2ReviewStateFromTasksMap(map, { activeTask: task }));
    if (
      (elKey === 'centralreviewform2' || elKey === 'review2') &&
      task?.ID != null &&
      lastHydratedCentral2TaskId.current !== task.ID
    ) {
      lastHydratedCentral2TaskId.current = task.ID;
      setForm2Review(buildForm2ReviewStateFromTasksMap(map, { activeTask: task }));
    }
  }, [elKey, task?.ID, tasksIdMap]);

  const formMethods = useForm({
    defaultValues: {
      registrationTracking: { sentTrackingCode: '' },
      surveyRegistrationTracking: { sentTrackingCode: '' },
      survey: { image_1: null, image_2: null, image_3: null, image_4: null, map_file: null, description: '' },
    },
  });

  useEffect(() => {
    if (!task?.ID || !elKey) return;
    if (lastHydratedFormTaskId.current === task.ID) return;
    const attachKey = getFormAttachKeyByElementId(elKey);
    if (!attachKey) return;
    const taskPayload = pickHydrationPayloadFromAttachedData(task.attached_data, attachKey);
    if (!taskPayload) return;
    lastHydratedFormTaskId.current = task.ID;
    formMethods.reset({ ...formMethods.getValues(), ...taskPayload });
  }, [task?.ID, task?.attached_data, elKey, formMethods]);

  const submitWithFormValues = useCallback(
    async (extra = {}) => onSubmitStepForm({ ...sanitizeValuesForEngineJson(formMethods.getValues()), ...(extra || {}) }),
    [formMethods, onSubmitStepForm]
  );

  if (!el) return <Alert severity="info">تسک فعالی برای نمایش نیست.</Alert>;

  const isReview = isReviewElementId(elKey);
  const showOuterReviewFooter = isReview && elKey !== 'review1' && elKey !== 'centralreviewform2' && elKey !== 'review2';
  const hideOuterUserFooter =
    elKey === 'entercode' || elKey === 'payment' || elKey === 'payment1' || elKey === 'paymentsurvey';
  const submitLockedForComplete = finalSubmitDisabled || isTaskAlreadyComplete(task);
  const engineReviewProps = {
    onEngineStepSubmit: onSubmitStepForm,
    engineSubmitting: submitting,
    engineSubmitError: submitError,
    finalSubmitDisabled: submitLockedForComplete,
  };

  let inner = null;
  switch (elKey) {
    case 'payment':
    case 'payment1':
    case 'paymentsurvey':
      inner = (
        <StaticPayment
          processInstanceId={processInstanceId}
          task={task}
          stepId={elKey === 'paymentsurvey' ? 'payment1' : elKey}
          serviceLabel="خدمت شماره دو"
          onEngineSubmit={onSubmitStepForm}
          engineSubmitting={submitting}
          engineSubmitError={submitError}
          finalSubmitDisabled={submitLockedForComplete}
        />
      );
      break;
    case 'form1':
      inner = <Page1Wizard taskKind="form1" review={form1Review} setReview={setForm1Review} formMethods={formMethods} />;
      break;
    case 'review1':
      inner = <Page1Wizard taskKind="review1" review={form1Review} setReview={setForm1Review} formMethods={formMethods} {...engineReviewProps} />;
      break;
    case 'entercode':
      inner = <EnterCodeStep onEngineSubmit={onSubmitStepForm} engineSubmitting={submitting} engineSubmitError={submitError} finalSubmitDisabled={submitLockedForComplete} />;
      break;
    case 'form2':
      inner = <Page2Wizard taskKind="form2" review={form2Review} setReview={setForm2Review} />;
      break;
    case 'centralreviewform2':
    case 'review2':
      inner = <Page2Wizard taskKind="centralReviewForm2" review={form2Review} setReview={setForm2Review} {...engineReviewProps} />;
      break;
    case 'tracking':
    case 'registrationtracking':
      inner = <RegistrationTrackingPage />;
      break;
    default:
      inner = <Alert severity="warning">مرحلهٔ BPMN شناخته‌شده نیست: <strong>{elKey || el}</strong></Alert>;
  }

  const bodyLocked = interactionLocked || waitForOtherUser;
  return (
    <FormProvider {...formMethods}>
      <Box sx={bodyLocked ? { pointerEvents: 'none', opacity: 0.72 } : undefined}>
        {inner}
        {!bodyLocked &&
          (showOuterReviewFooter ? (
            <ReviewTaskFooter submitting={submitting} submitError={submitError} onSubmit={submitWithFormValues} />
          ) : isReview || hideOuterUserFooter ? null : (
            <UserTaskFooter submitting={submitting} submitError={submitError} onSubmit={submitWithFormValues} finalSubmitDisabled={submitLockedForComplete} />
          ))}
      </Box>
    </FormProvider>
  );
}
