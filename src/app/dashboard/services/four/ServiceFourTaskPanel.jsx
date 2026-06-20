'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

import {
  buildForm1ReviewStateFromTasksMap,
  buildForm2ReviewStateFromTasksMap,
  buildExpertVisitReviewStateFromTasksMap,
  sanitizeValuesForEngineJson,
} from '../one/engine-api';
import { isService4PreSendReviewElementId, isService4ReviewElementId } from './service4-step-config';

import StaticPayment from './payment/WorkflowWizard';
import PaymentSurvey from './payment-survey/WorkflowWizard';
import Page1Wizard from './page1/WorkflowWizard';
import Page2Wizard from './page2/WorkflowWizard';
import RegistrationTrackingPage from './registration-tracking/WorkflowWizard';
import IssuedDocumentPage from './issued-document/WorkflowWizard';
import ClaimConfirmationPage from './claim-confirmation/WorkflowWizard';
import ExpertVisitPage from './expert-visit/WorkflowWizard';
import AnnouncementPage from './announcement/WorkflowWizard';
import CourtDecisionPage from './court-decision/WorkflowWizard';
import EnterCodeStep from '../one/EnterCodeStep';
import { ProcessWorkTimeline } from '../_components/process-work-timeline';
import {
  createDefaultAnnouncementValues,
  createService4AnnouncementSchema,
  resolveIsVillagePropertyFromContext,
} from './announcement/schemas';
import {
  createDefaultCourtDecisionValues,
  service4CourtDecisionSchema,
} from './court-decision/schemas';
import {
  createDefaultBoundaryAnnouncementValues,
  createService4BoundaryAnnouncementSchema,
  normalizeBoundaryAnnouncementPayload,
} from './boundary-announcement/schemas';
import {
  createDefaultDocumentDeliveryValues,
  normalizeDocumentDeliveryPayload,
  service4DocumentDeliverySchema,
} from './document-delivery/schemas';
import {
  createDefaultLandOwnerFeePaymentValues,
  createService4LandOwnerFeePaymentSchema,
  normalizeLandOwnerFeePaymentPayload,
} from './land-owner-fee-payment/schemas';
import {
  createDefaultVisitBoundarySides,
  createDefaultVisitEasementRights,
  createDefaultVisitWitnesses,
  normalizeVisitBoundarySides,
  normalizeVisitEasementRights,
  normalizeVisitOtherDocumentsInquiries,
  normalizeVisitWitnesses,
} from './expert-visit/schemas';

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

function resolveCommitteeContextFromTask(task) {
  const ad = asObject(task?.attached_data);
  if (!ad) return { committee_tracking_no: '', hearing_at: '' };
  const step = asObject(ad.stage6_committee) ?? ad;
  return {
    committee_tracking_no: String(step.committee_tracking_no ?? ad.committee_tracking_no ?? '').trim(),
    hearing_at: String(step.hearing_at ?? ad.hearing_at ?? '').trim(),
  };
}

function resolveObjectionContextFromTask(task) {
  const ad = asObject(task?.attached_data);
  if (!ad) {
    return {
      deed_fee: '',
      sheba: '',
      payment_id: '',
      land_owner_fee: '',
      registry_status_m13: '',
      objection: '',
    };
  }
  const step = asObject(ad.stage8_objection) ?? ad;
  return {
    deed_fee: String(step.deed_fee ?? ad.deed_fee ?? '').trim(),
    sheba: String(step.sheba ?? ad.sheba ?? '').trim(),
    payment_id: String(step.payment_id ?? ad.payment_id ?? '').trim(),
    land_owner_fee: String(step.land_owner_fee ?? ad.land_owner_fee ?? '').trim(),
    registry_status_m13: String(step.registry_status_m13 ?? ad.registry_status_m13 ?? '').trim(),
    objection: String(step.objection ?? ad.objection ?? '').trim(),
  };
}

function resolveLandOwnerFeeContextFromTasksMap(tasksIdMap) {
  const map = tasksIdMap && typeof tasksIdMap === 'object' ? tasksIdMap : null;
  if (!map) {
    return { land_owner_fee: '', sheba: '' };
  }
  for (const item of Object.values(map)) {
    const attached = item?.attached_data;
    if (!attached || typeof attached !== 'object') continue;
    const ctx = resolveObjectionContextFromTask({ attached_data: attached });
    if (ctx.land_owner_fee || ctx.sheba) {
      return {
        land_owner_fee: ctx.land_owner_fee,
        sheba: ctx.sheba,
      };
    }
    const flatFee = String(attached.land_owner_fee ?? '').trim();
    const flatSheba = String(attached.sheba ?? '').trim();
    if (flatFee || flatSheba) {
      return { land_owner_fee: flatFee, sheba: flatSheba };
    }
  }
  return { land_owner_fee: '', sheba: '' };
}

function resolveCourtFinalityContextFromTask(task) {
  const ad = asObject(task?.attached_data);
  if (!ad) {
    return {
      court_finality_tracking_no: '',
      court_finality_at: '',
      court_decision_date: '',
    };
  }
  const step = asObject(ad.stage10_committee_review) ?? ad;
  const courtNested = asObject(step.court_decision) ?? asObject(step.court_decision_summary) ?? asObject(ad.court_decision);
  return {
    court_finality_tracking_no: String(step.court_finality_tracking_no ?? ad.court_finality_tracking_no ?? '').trim(),
    court_finality_at: String(step.court_finality_at ?? ad.court_finality_at ?? '').trim(),
    court_decision_date: String(
      courtNested?.court_decision_date ?? step.court_decision_date ?? ad.court_decision_date ?? '',
    ).trim(),
  };
}

function formatFeeAmount(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '—';
  const numeric = Number(raw.replace(/,/g, ''));
  if (Number.isFinite(numeric)) {
    try {
      return new Intl.NumberFormat('fa-IR').format(numeric);
    } catch {
      return raw;
    }
  }
  return raw;
}

function formatObjectionStatus(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '—';
  const norm = raw.toLowerCase();
  if (norm === 'true' || norm === '1' || norm === 'yes') return 'اعتراض ثبت شده';
  if (norm === 'false' || norm === '0' || norm === 'no') return 'فاقد اعتراض';
  if (raw.toUpperCase() === 'OBJECTION' || raw.toUpperCase() === 'HAS_OBJECTION') return 'اعتراض ثبت شده';
  if (raw.toUpperCase() === 'NO_OBJECTION' || raw.toUpperCase() === 'FINAL' || raw.toUpperCase() === 'FINALITY') {
    return 'قطعیت رأی / فاقد اعتراض';
  }
  return raw;
}

function formatHearingAt(value) {
  if (!value) return '—';
  const raw = String(value).trim();
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return raw;
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(parsed));
  } catch {
    return raw;
  }
}

function CommitteeWaitReadOnlyRow({ label, value }) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700}>
        {label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {value || '—'}
      </Typography>
    </Box>
  );
}

function getFormAttachKeyByElementId(elKey) {
  if (elKey === 'stage1_initial' || elKey === 'form1' || elKey === 'review1') return 'form1';
  if (elKey === 'form2' || elKey === 'review2' || elKey === 'centralreviewform2') return 'form2';
  if (elKey === 'tracking' || elKey === 'registrationtracking') return 'registrationTracking';
  if (elKey === 'stage12_issued' || elKey === 'issued') return 'issuedDocument';
  if (elKey === 'stage3_claim_confirm' || elKey === 'claimconfirm') return 'claimConfirmation';
  if (elKey === 'stage5_expert_visit' || elKey === 'expertvisit' || elKey === 'review5') return 'expertVisit';
  if (elKey === 'stage7_announcement' || elKey === 'announcement') return 'announcement';
  if (elKey === 'stage9_court_decision' || elKey === 'courtdecision') return 'courtDecision';
  if (elKey === 'entercode') return 'enterCode';
  return null;
}

function resolveApplicantNationalIdFromTasksMap(tasksIdMap) {
  const map = tasksIdMap && typeof tasksIdMap === 'object' ? tasksIdMap : null;
  if (!map) return '';
  for (const item of Object.values(map)) {
    const el = String(item?.element_id ?? '')
      .trim()
      .toLowerCase();
    if (el !== 'stage1_initial' && el !== 'form1') continue;
    const payload = pickHydrationPayloadFromAttachedData(item?.attached_data, 'form1');
    const nationalId = payload?.national_id;
    if (nationalId) return String(nationalId).trim();
  }
  return '';
}

function resolveClaimPropertyOwnershipTypeFromTasksMap(tasksIdMap) {
  const map = tasksIdMap && typeof tasksIdMap === 'object' ? tasksIdMap : null;
  if (!map) return '';
  for (const item of Object.values(map)) {
    const attached = item?.attached_data;
    if (!attached || typeof attached !== 'object') continue;
    const claimMapFromRoot = asObject(attached.claim_map_data);
    if (claimMapFromRoot?.claim_property_ownership_type) {
      return String(claimMapFromRoot.claim_property_ownership_type).trim();
    }
    const claimConfirm = pickHydrationPayloadFromAttachedData(attached, 'claimConfirmation');
    const claimMapFromConfirm = asObject(claimConfirm?.claim_map_data);
    if (claimMapFromConfirm?.claim_property_ownership_type) {
      return String(claimMapFromConfirm.claim_property_ownership_type).trim();
    }
    const stage3 = asObject(attached.stage3_claim_confirm);
    const claimMapFromStage3 = asObject(stage3?.claim_map_data);
    if (claimMapFromStage3?.claim_property_ownership_type) {
      return String(claimMapFromStage3.claim_property_ownership_type).trim();
    }
  }
  return '';
}

function resolveIsVillagePropertyFromTasksMap(tasksIdMap) {
  const map = tasksIdMap && typeof tasksIdMap === 'object' ? tasksIdMap : null;
  if (!map) return false;
  for (const item of Object.values(map)) {
    const attached = item?.attached_data;
    if (!attached || typeof attached !== 'object') continue;
    if (
      resolveIsVillagePropertyFromContext({
        is_village_property: attached.is_village_property,
        claim_map_data: attached.claim_map_data,
        registry_response: attached.registry_response,
      })
    ) {
      return true;
    }
    const claimConfirm = pickHydrationPayloadFromAttachedData(attached, 'claimConfirmation');
    if (
      resolveIsVillagePropertyFromContext({
        claim_map_data: claimConfirm?.claim_map_data,
      })
    ) {
      return true;
    }
    const tracking = pickHydrationPayloadFromAttachedData(attached, 'registrationTracking');
    if (
      resolveIsVillagePropertyFromContext({
        registry_response: tracking?.registry_response,
        claim_map_data: tracking?.claim_map_data,
      })
    ) {
      return true;
    }
    const form1 = pickHydrationPayloadFromAttachedData(attached, 'form1');
    if (resolveIsVillagePropertyFromContext({ is_village_property: form1?.is_village_property })) {
      return true;
    }
  }
  return false;
}

function resolveRegionalValueContextFromTasksMap(tasksIdMap) {
  const map = tasksIdMap && typeof tasksIdMap === 'object' ? tasksIdMap : null;
  if (!map) {
    return { regional_value: '', regional_value_determined: '' };
  }
  let regionalValue = '';
  let regionalValueDetermined = '';
  for (const item of Object.values(map)) {
    const attached = item?.attached_data;
    if (!attached || typeof attached !== 'object') continue;
    const tracking = pickHydrationPayloadFromAttachedData(attached, 'registrationTracking');
    const registryResponse = asObject(tracking?.registry_response) ?? asObject(attached.registry_response);
    if (!regionalValue && tracking?.regional_value) {
      regionalValue = String(tracking.regional_value).trim();
    }
    if (!regionalValueDetermined && tracking?.regional_value_determined) {
      regionalValueDetermined = String(tracking.regional_value_determined).trim();
    }
    if (!regionalValue && attached.regional_value) {
      regionalValue = String(attached.regional_value).trim();
    }
    if (!regionalValueDetermined && attached.regional_value_determined) {
      regionalValueDetermined = String(attached.regional_value_determined).trim();
    }
    if (registryResponse) {
      if (!regionalValue && registryResponse.regional_value != null) {
        regionalValue = String(registryResponse.regional_value).trim();
      }
      if (!regionalValueDetermined && registryResponse.regional_value_determined != null) {
        regionalValueDetermined = String(registryResponse.regional_value_determined).trim();
      }
    }
  }
  return { regional_value: regionalValue, regional_value_determined: regionalValueDetermined };
}

function isServiceReviewTaskType(task) {
  const typeNorm = String(task?.type ?? '')
    .trim()
    .replace(/\s+/g, '');
  return typeNorm === 'SERVICE_REVIEW' || typeNorm === 'ServiceReview';
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
  if (attachKey === 'form1') {
    const fromStage1 = asObject(ad.stage1_initial);
    if (fromStage1) return fromStage1;
    const fromFormStage1 = asObject(form?.stage1_initial);
    if (fromFormStage1) return fromFormStage1;
    const fromPreviousStage1 = asObject(previous?.stage1_initial);
    if (fromPreviousStage1) return fromPreviousStage1;
  }
  if (attachKey === 'claimConfirmation') {
    const fromStage3 = asObject(ad.stage3_claim_confirm);
    if (fromStage3) return fromStage3;
    const fromFormStage3 = asObject(form?.stage3_claim_confirm);
    if (fromFormStage3) return fromFormStage3;
    const fromPreviousStage3 = asObject(previous?.stage3_claim_confirm);
    if (fromPreviousStage3) return fromPreviousStage3;
    const claimMapData = asObject(ad.claim_map_data);
    if (claimMapData) {
      return { claim_map_data: claimMapData, claim_confirmed: false };
    }
  }
  if (attachKey === 'expertVisit') {
    const fromStage5 = asObject(ad.stage5_expert_visit);
    if (fromStage5) return fromStage5;
    const fromFormStage5 = asObject(form?.stage5_expert_visit);
    if (fromFormStage5) return fromFormStage5;
    const fromPreviousStage5 = asObject(previous?.stage5_expert_visit);
    if (fromPreviousStage5) return fromPreviousStage5;
  }
  if (attachKey === 'announcement') {
    const fromStage7 = asObject(ad.stage7_announcement);
    if (fromStage7) return fromStage7;
    const fromFormStage7 = asObject(form?.stage7_announcement);
    if (fromFormStage7) return fromFormStage7;
    const fromPreviousStage7 = asObject(previous?.stage7_announcement);
    if (fromPreviousStage7) return fromPreviousStage7;
  }
  if (attachKey === 'courtDecision') {
    const fromStage9 = asObject(ad.stage9_court_decision);
    if (fromStage9) return fromStage9;
    const fromFormStage9 = asObject(form?.stage9_court_decision);
    if (fromFormStage9) return fromFormStage9;
    const fromPreviousStage9 = asObject(previous?.stage9_court_decision);
    if (fromPreviousStage9) return fromPreviousStage9;
    const fromCourtDecision = asObject(ad.court_decision);
    if (fromCourtDecision) return fromCourtDecision;
  }
  if (attachKey === 'form2') {
    const fromForm2 = asObject(ad.form2);
    if (fromForm2) return fromForm2;
    const fromFormForm2 = asObject(form?.form2);
    if (fromFormForm2) return fromFormForm2;
    const fromPreviousForm2 = asObject(previous?.form2);
    if (fromPreviousForm2) return fromPreviousForm2;
    const fromBoundaryAnnouncement = asObject(ad.boundary_announcement);
    if (fromBoundaryAnnouncement) return fromBoundaryAnnouncement;
    const fromDocumentDelivery = asObject(ad.document_delivery);
    if (fromDocumentDelivery) return fromDocumentDelivery;
    const fromLandOwnerFeePayment = asObject(ad.land_owner_fee_payment);
    if (fromLandOwnerFeePayment) return fromLandOwnerFeePayment;
  }
  if (attachKey === 'registrationTracking') {
    const fromTracking = asObject(ad.tracking);
    if (fromTracking) return fromTracking;
    const fromFormTracking = asObject(form?.tracking);
    if (fromFormTracking) return fromFormTracking;
    const fromPreviousTracking = asObject(previous?.tracking);
    if (fromPreviousTracking) return fromPreviousTracking;
    const registryResponse = ad.registry_response ?? form?.registry_response ?? previous?.registry_response;
    if (registryResponse != null && registryResponse !== '') {
      return {
        registry_response: registryResponse,
        registry_status: ad.registry_status ?? form?.registry_status ?? previous?.registry_status,
        registry_reference_id:
          ad.registry_reference_id ?? form?.registry_reference_id ?? previous?.registry_reference_id,
      };
    }
  }
  if (attachKey === 'issuedDocument') {
    const fromStage12 = asObject(ad.stage12_issued);
    if (fromStage12) return fromStage12;
    const fromFormStage12 = asObject(form?.stage12_issued);
    if (fromFormStage12) return fromFormStage12;
    const fromPreviousStage12 = asObject(previous?.stage12_issued);
    if (fromPreviousStage12) return fromPreviousStage12;
    const fromIssuedDocument = asObject(ad.issued_document);
    if (fromIssuedDocument) return fromIssuedDocument;
    const documentNumber = ad.issued_document_number ?? form?.issued_document_number ?? previous?.issued_document_number;
    const documentDate = ad.issued_document_date ?? form?.issued_document_date ?? previous?.issued_document_date;
    const downloadUrl =
      ad.issued_document_download_url ?? form?.issued_document_download_url ?? previous?.issued_document_download_url;
    if (documentNumber || documentDate || downloadUrl) {
      return {
        issued_document_number: documentNumber,
        issued_document_date: documentDate,
        issued_document_download_url: downloadUrl,
      };
    }
  }
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

const SERVICE4_STAGE1_ELEMENT_IDS = ['stage1_initial', 'form1'];
const SERVICE4_EXPERT_VISIT_ELEMENT_IDS = ['stage5_expert_visit', 'expertvisit'];

export default function ServiceFourTaskPanel(props) {
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
  const [expertVisitReview, setExpertVisitReview] = useState(initialFormReview);
  const lastHydratedReview1TaskId = useRef(null);
  const lastHydratedReview5TaskId = useRef(null);
  const lastHydratedCentral2TaskId = useRef(null);
  const lastHydratedFormTaskId = useRef(null);

  useEffect(() => {
    lastHydratedReview1TaskId.current = null;
    lastHydratedReview5TaskId.current = null;
    lastHydratedCentral2TaskId.current = null;
    lastHydratedFormTaskId.current = null;
  }, [reviewHydrationKey]);

  useEffect(() => {
    const map = tasksIdMap && typeof tasksIdMap === 'object' ? tasksIdMap : null;
    if (!map) return;
    if (elKey === 'stage1_initial' || elKey === 'form1') {
      return void setForm1Review(
        buildForm1ReviewStateFromTasksMap(map, {
          activeTask: task,
          formElementIds: SERVICE4_STAGE1_ELEMENT_IDS,
        }),
      );
    }
    if (elKey === 'review1' && task?.ID != null && lastHydratedReview1TaskId.current !== task.ID) {
      lastHydratedReview1TaskId.current = task.ID;
      setForm1Review(
        buildForm1ReviewStateFromTasksMap(map, {
          activeTask: task,
          formElementIds: SERVICE4_STAGE1_ELEMENT_IDS,
        }),
      );
    }
  }, [elKey, task?.ID, tasksIdMap]);

  useEffect(() => {
    const map = tasksIdMap && typeof tasksIdMap === 'object' ? tasksIdMap : null;
    if (!map) return;
    if (elKey === 'stage5_expert_visit' || elKey === 'expertvisit') {
      return void setExpertVisitReview(
        buildExpertVisitReviewStateFromTasksMap(map, {
          activeTask: task,
          formElementIds: SERVICE4_EXPERT_VISIT_ELEMENT_IDS,
        }),
      );
    }
    if (elKey === 'review5' && task?.ID != null && lastHydratedReview5TaskId.current !== task.ID) {
      lastHydratedReview5TaskId.current = task.ID;
      setExpertVisitReview(
        buildExpertVisitReviewStateFromTasksMap(map, {
          activeTask: task,
          formElementIds: SERVICE4_EXPERT_VISIT_ELEMENT_IDS,
        }),
      );
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
      registrationTracking: {
        sentTrackingCode: '',
        registry_response: {},
        registry_status: '',
        registry_reference_id: '',
      },
      issuedDocument: {
        issued_document_number: '',
        issued_document_date: '',
        issued_document_download_url: '',
      },
      claimConfirmation: { claim_confirmed: false, claim_map_data: {} },
      expertVisit: {
        registry_inquiry_cannot_issue: '',
        visit_expert_national_id: '',
        visit_date: '',
        visit_expert_personal_presence: '',
        visit_possession_map_match_status: '',
        visit_corrective_map_tracking_code: '',
        applicant_national_id: '',
        claim_property_ownership_type: '',
        visit_property_type: '',
        visit_property_usage: '',
        visit_neighbor_easement_rights: '',
        visit_building_age: '',
        visit_building_description: '',
        visit_building_shared_electricity_gas: '',
        visit_agricultural_land_under_cultivation: '',
        visit_agricultural_land_cultivation_type: '',
        visit_agricultural_land_fence: '',
        visit_agricultural_land_description: '',
        visit_garden_tree_count: '',
        visit_garden_tree_type: '',
        visit_garden_age: '',
        visit_garden_description: '',
        visit_easement_rights: createDefaultVisitEasementRights(),
        visit_main_plaque_number: '',
        visit_sub_plaque_number: '',
        visit_registration_section: '',
        visit_joint_share_total: '',
        visit_joint_share_partial: '',
        visit_possession_to_share_total: '',
        visit_possession_to_share_partial: '',
        visit_ownership_transfer_type: '',
        visit_ownership_document_type: '',
        visit_ownership_document_date: '',
        visit_ownership_document_image: null,
        visit_last_official_owner: '',
        visit_possession_verification_status: '',
        visit_possession_location_image: null,
        visit_possession_verification_description: '',
        visit_land_owner_contract_type: '',
        visit_land_owner_contract_date: '',
        visit_land_owner_name: '',
        visit_land_owner_national_id: '',
        visit_land_owner_contract_document_image: null,
        regional_value: '',
        regional_value_determined: '',
        visit_expert_regional_value: '',
        visit_boundary_sides: createDefaultVisitBoundarySides(),
        visit_witnesses: createDefaultVisitWitnesses(),
        visit_other_documents_inquiries: [],
      },
      surveyRegistrationTracking: { sentTrackingCode: '' },
      survey: { image_1: null, image_2: null, image_3: null, image_4: null, map_file: null, description: '' },
      announcement: createDefaultAnnouncementValues(),
      boundaryAnnouncement: createDefaultBoundaryAnnouncementValues(),
      documentDelivery: createDefaultDocumentDeliveryValues(),
      landOwnerFeePayment: createDefaultLandOwnerFeePaymentValues(),
      courtDecision: createDefaultCourtDecisionValues(),
    },
  });

  const claimConfirmed = useWatch({
    control: formMethods.control,
    name: 'claimConfirmation.claim_confirmed',
  });
  const isVillageProperty = resolveIsVillagePropertyFromTasksMap(tasksIdMap);
  const landOwnerFeeContext = resolveLandOwnerFeeContextFromTasksMap(tasksIdMap);
  const landOwnerFeeAmount = landOwnerFeeContext.land_owner_fee;
  const landOwnerFeeSheba = landOwnerFeeContext.sheba;

  useEffect(() => {
    if (elKey !== 'stage5_expert_visit' && elKey !== 'expertvisit') return;
    const applicantNationalId = resolveApplicantNationalIdFromTasksMap(tasksIdMap);
    if (applicantNationalId) {
      const current = formMethods.getValues('expertVisit.applicant_national_id');
      if (current !== applicantNationalId) {
        formMethods.setValue('expertVisit.applicant_national_id', applicantNationalId, {
          shouldDirty: false,
          shouldValidate: false,
        });
      }
    }
    const claimPropertyOwnershipType = resolveClaimPropertyOwnershipTypeFromTasksMap(tasksIdMap);
    if (claimPropertyOwnershipType) {
      const currentClaimType = formMethods.getValues('expertVisit.claim_property_ownership_type');
      if (currentClaimType !== claimPropertyOwnershipType) {
        formMethods.setValue('expertVisit.claim_property_ownership_type', claimPropertyOwnershipType, {
          shouldDirty: false,
          shouldValidate: false,
        });
      }
    }
    const regionalContext = resolveRegionalValueContextFromTasksMap(tasksIdMap);
    if (regionalContext.regional_value) {
      const currentRegionalValue = formMethods.getValues('expertVisit.regional_value');
      if (currentRegionalValue !== regionalContext.regional_value) {
        formMethods.setValue('expertVisit.regional_value', regionalContext.regional_value, {
          shouldDirty: false,
          shouldValidate: false,
        });
      }
    }
    if (regionalContext.regional_value_determined) {
      const currentRegionalFlag = formMethods.getValues('expertVisit.regional_value_determined');
      if (currentRegionalFlag !== regionalContext.regional_value_determined) {
        formMethods.setValue('expertVisit.regional_value_determined', regionalContext.regional_value_determined, {
          shouldDirty: false,
          shouldValidate: false,
        });
      }
    }
  }, [elKey, tasksIdMap, formMethods]);

  useEffect(() => {
    if (!task?.ID || !elKey) return;
    if (lastHydratedFormTaskId.current === task.ID) return;
    const attachKey = getFormAttachKeyByElementId(elKey);
    if (!attachKey) return;
    const taskPayload = pickHydrationPayloadFromAttachedData(task.attached_data, attachKey);
    if (!taskPayload) return;
    lastHydratedFormTaskId.current = task.ID;
    if (attachKey === 'claimConfirmation') {
      formMethods.reset({
        ...formMethods.getValues(),
        claimConfirmation: {
          claim_confirmed: false,
          claim_map_data: {},
          ...formMethods.getValues().claimConfirmation,
          ...taskPayload,
        },
      });
      return;
    }
    if (attachKey === 'expertVisit') {
      formMethods.reset({
        ...formMethods.getValues(),
        expertVisit: {
          registry_inquiry_cannot_issue: '',
          visit_expert_national_id: '',
          visit_date: '',
          visit_expert_personal_presence: '',
          visit_possession_map_match_status: '',
          visit_corrective_map_tracking_code: '',
          applicant_national_id: resolveApplicantNationalIdFromTasksMap(tasksIdMap),
          claim_property_ownership_type: resolveClaimPropertyOwnershipTypeFromTasksMap(tasksIdMap),
          visit_property_type: '',
          visit_property_usage: '',
          visit_neighbor_easement_rights: '',
          visit_building_age: '',
          visit_building_description: '',
          visit_building_shared_electricity_gas: '',
          visit_agricultural_land_under_cultivation: '',
          visit_agricultural_land_cultivation_type: '',
          visit_agricultural_land_fence: '',
          visit_agricultural_land_description: '',
          visit_garden_tree_count: '',
          visit_garden_tree_type: '',
          visit_garden_age: '',
          visit_garden_description: '',
          visit_easement_rights: createDefaultVisitEasementRights(),
          visit_main_plaque_number: '',
          visit_sub_plaque_number: '',
          visit_registration_section: '',
          visit_joint_share_total: '',
          visit_joint_share_partial: '',
          visit_possession_to_share_total: '',
          visit_possession_to_share_partial: '',
          visit_ownership_transfer_type: '',
          visit_ownership_document_type: '',
          visit_ownership_document_date: '',
          visit_ownership_document_image: null,
          visit_last_official_owner: '',
          visit_possession_verification_status: '',
          visit_possession_location_image: null,
          visit_possession_verification_description: '',
          visit_land_owner_contract_type: '',
          visit_land_owner_contract_date: '',
          visit_land_owner_name: '',
          visit_land_owner_national_id: '',
          visit_land_owner_contract_document_image: null,
          regional_value: resolveRegionalValueContextFromTasksMap(tasksIdMap).regional_value,
          regional_value_determined: resolveRegionalValueContextFromTasksMap(tasksIdMap).regional_value_determined,
          visit_expert_regional_value: '',
          visit_boundary_sides: createDefaultVisitBoundarySides(),
          visit_witnesses: createDefaultVisitWitnesses(),
          visit_other_documents_inquiries: [],
          ...formMethods.getValues().expertVisit,
          ...taskPayload,
          visit_boundary_sides: normalizeVisitBoundarySides(
            taskPayload.visit_boundary_sides ?? formMethods.getValues().expertVisit?.visit_boundary_sides,
          ),
          visit_witnesses: normalizeVisitWitnesses(
            taskPayload.visit_witnesses ?? formMethods.getValues().expertVisit?.visit_witnesses,
          ),
          visit_easement_rights: normalizeVisitEasementRights(
            taskPayload.visit_easement_rights ?? formMethods.getValues().expertVisit?.visit_easement_rights,
          ),
          visit_other_documents_inquiries: normalizeVisitOtherDocumentsInquiries(
            taskPayload.visit_other_documents_inquiries ??
              formMethods.getValues().expertVisit?.visit_other_documents_inquiries,
          ),
        },
      });
      return;
    }
    if (attachKey === 'announcement') {
      formMethods.reset({
        ...formMethods.getValues(),
        announcement: {
          ...createDefaultAnnouncementValues(),
          ...formMethods.getValues().announcement,
          ...taskPayload,
        },
      });
      return;
    }
    if (attachKey === 'courtDecision') {
      formMethods.reset({
        ...formMethods.getValues(),
        courtDecision: {
          ...createDefaultCourtDecisionValues(),
          ...formMethods.getValues().courtDecision,
          ...taskPayload,
        },
      });
      return;
    }
    if (attachKey === 'form2') {
      formMethods.reset({
        ...formMethods.getValues(),
        boundaryAnnouncement: {
          ...createDefaultBoundaryAnnouncementValues(),
          ...formMethods.getValues().boundaryAnnouncement,
          ...normalizeBoundaryAnnouncementPayload(taskPayload),
        },
        documentDelivery: {
          ...createDefaultDocumentDeliveryValues(),
          ...formMethods.getValues().documentDelivery,
          ...normalizeDocumentDeliveryPayload(taskPayload),
        },
        landOwnerFeePayment: {
          ...createDefaultLandOwnerFeePaymentValues(),
          ...formMethods.getValues().landOwnerFeePayment,
          ...normalizeLandOwnerFeePaymentPayload(taskPayload),
        },
      });
      return;
    }
    if (attachKey === 'registrationTracking') {
      formMethods.reset({
        ...formMethods.getValues(),
        registrationTracking: {
          sentTrackingCode: '',
          registry_response: {},
          registry_status: '',
          registry_reference_id: '',
          ...formMethods.getValues().registrationTracking,
          ...taskPayload,
        },
      });
      return;
    }
    if (attachKey === 'issuedDocument') {
      formMethods.reset({
        ...formMethods.getValues(),
        issuedDocument: {
          issued_document_number: '',
          issued_document_date: '',
          issued_document_download_url: '',
          ...formMethods.getValues().issuedDocument,
          ...taskPayload,
        },
      });
      return;
    }
    formMethods.reset({ ...formMethods.getValues(), ...taskPayload });
  }, [task?.ID, task?.attached_data, elKey, formMethods, tasksIdMap]);

  const submitWithFormValues = useCallback(
    async (extra = {}) => {
      if (elKey === 'stage7_announcement' || elKey === 'announcement') {
        const announcementData = formMethods.getValues('announcement') ?? {};
        const parsed = createService4AnnouncementSchema(isVillageProperty).safeParse(announcementData);
        if (!parsed.success) {
          formMethods.clearErrors('announcement');
          parsed.error.issues.forEach((issue) => {
            const fieldKey = issue.path?.[0];
            if (fieldKey) {
              formMethods.setError(`announcement.${fieldKey}`, { type: 'manual', message: issue.message });
            }
          });
          return false;
        }
      }
      if (elKey === 'stage9_court_decision' || elKey === 'courtdecision') {
        const courtDecisionData = formMethods.getValues('courtDecision') ?? {};
        const parsed = service4CourtDecisionSchema.safeParse(courtDecisionData);
        if (!parsed.success) {
          formMethods.clearErrors('courtDecision');
          parsed.error.issues.forEach((issue) => {
            const fieldKey = issue.path?.[0];
            if (fieldKey) {
              formMethods.setError(`courtDecision.${fieldKey}`, { type: 'manual', message: issue.message });
            }
          });
          return false;
        }
      }
      if (elKey === 'form2') {
        const boundaryAnnouncementData = formMethods.getValues('boundaryAnnouncement') ?? {};
        const boundaryParsed = createService4BoundaryAnnouncementSchema(isVillageProperty).safeParse(
          boundaryAnnouncementData,
        );
        if (!boundaryParsed.success) {
          formMethods.clearErrors('boundaryAnnouncement');
          boundaryParsed.error.issues.forEach((issue) => {
            const fieldKey = issue.path?.[0];
            if (fieldKey) {
              formMethods.setError(`boundaryAnnouncement.${fieldKey}`, { type: 'manual', message: issue.message });
            }
          });
          return false;
        }
        const documentDeliveryData = formMethods.getValues('documentDelivery') ?? {};
        const deliveryParsed = service4DocumentDeliverySchema.safeParse(documentDeliveryData);
        if (!deliveryParsed.success) {
          formMethods.clearErrors('documentDelivery');
          deliveryParsed.error.issues.forEach((issue) => {
            const fieldKey = issue.path?.[0];
            if (fieldKey) {
              formMethods.setError(`documentDelivery.${fieldKey}`, { type: 'manual', message: issue.message });
            }
          });
          return false;
        }
        const landOwnerFeePaymentData = formMethods.getValues('landOwnerFeePayment') ?? {};
        const landOwnerFeeParsed = createService4LandOwnerFeePaymentSchema(landOwnerFeeAmount).safeParse(
          landOwnerFeePaymentData,
        );
        if (!landOwnerFeeParsed.success) {
          formMethods.clearErrors('landOwnerFeePayment');
          landOwnerFeeParsed.error.issues.forEach((issue) => {
            const fieldKey = issue.path?.[0];
            if (fieldKey) {
              formMethods.setError(`landOwnerFeePayment.${fieldKey}`, { type: 'manual', message: issue.message });
            }
          });
          return false;
        }
      }
      return onSubmitStepForm({
        ...sanitizeValuesForEngineJson(formMethods.getValues()),
        ...(extra || {}),
      });
    },
    [elKey, formMethods, isVillageProperty, landOwnerFeeAmount, onSubmitStepForm],
  );

  if (!el) return <Alert severity="info">تسک فعالی برای نمایش نیست.</Alert>;

  const isReview = isService4ReviewElementId(elKey) || isServiceReviewTaskType(task);
  const showOuterReviewFooter =
    isReview &&
    !isService4PreSendReviewElementId(elKey) &&
    elKey !== 'centralreviewform2' &&
    elKey !== 'review2';
  /** ورود کد پیامک و پرداخت POS فوتر اختصاصی داخل همان کامپوننت دارند */
  const hideOuterUserFooter =
    elKey === 'entercode' ||
    elKey === 'payment' ||
    elKey === 'payment1' ||
    elKey === 'paymentsurvey' ||
    elKey === 'stage11_document_fee' ||
    elKey === 'stage11_announcement_fee' ||
    elKey === 'stage11_land_owner_fee' ||
    elKey === 'documentfee' ||
    elKey === 'announcementfee' ||
    elKey === 'landownerfee';
  const submitLockedForComplete = finalSubmitDisabled || isTaskAlreadyComplete(task);
  const claimConfirmSubmitLocked =
    (elKey === 'stage3_claim_confirm' || elKey === 'claimconfirm') && !claimConfirmed;
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
          serviceLabel="خدمت شماره چهار"
          onEngineSubmit={onSubmitStepForm}
          engineSubmitting={submitting}
          engineSubmitError={submitError}
          finalSubmitDisabled={submitLockedForComplete}
        />
      );
      break;
    case 'stage11_document_fee':
    case 'documentfee':
      inner = (
        <StaticPayment
          processInstanceId={processInstanceId}
          task={task}
          stepId="stage11_document_fee"
          serviceLabel="خدمت شماره چهار — پرداخت هزینه صدور سند"
          onEngineSubmit={onSubmitStepForm}
          engineSubmitting={submitting}
          engineSubmitError={submitError}
          finalSubmitDisabled={submitLockedForComplete}
        />
      );
      break;
    case 'stage11_announcement_fee':
    case 'announcementfee':
      inner = (
        <PaymentSurvey
          processInstanceId={processInstanceId}
          task={task}
          stepId="stage11_announcement_fee"
          serviceLabel="خدمت شماره چهار — پرداخت هزینه آگهی تحدید حدود"
          onEngineSubmit={onSubmitStepForm}
          engineSubmitting={submitting}
          engineSubmitError={submitError}
          finalSubmitDisabled={submitLockedForComplete}
        />
      );
      break;
    case 'stage11_land_owner_fee':
    case 'landownerfee':
      inner = (
        <StaticPayment
          processInstanceId={processInstanceId}
          task={task}
          stepId="stage11_land_owner_fee"
          serviceLabel="خدمت شماره چهار — پرداخت اجرت/بهای عرصه (ماده ۱۲)"
          onEngineSubmit={onSubmitStepForm}
          engineSubmitting={submitting}
          engineSubmitError={submitError}
          finalSubmitDisabled={submitLockedForComplete}
        />
      );
      break;
    case 'stage1_initial':
    case 'form1':
      inner = <Page1Wizard taskKind="form1" review={form1Review} setReview={setForm1Review} formMethods={formMethods} />;
      break;
    case 'review1':
      inner = <Page1Wizard taskKind="review1" review={form1Review} setReview={setForm1Review} formMethods={formMethods} {...engineReviewProps} />;
      break;
    case 'entercode':
      inner = (
        <EnterCodeStep
          onEngineSubmit={onSubmitStepForm}
          engineSubmitting={submitting}
          engineSubmitError={submitError}
          finalSubmitDisabled={submitLockedForComplete}
        />
      );
      break;
    case 'stage3_claim_confirm':
    case 'claimconfirm':
      inner = <ClaimConfirmationPage />;
      break;
    case 'stage4_registry_inquiry':
      inner = (
        <Alert severity="info" variant="outlined">
          <Typography variant="body2">
            استعلام ثبتی سازمان در حال انجام است. این مرحله توسط کاربر مجاز (شرکت / شعبه مرکزی) در موتور
            بررسی می‌شود و نیازی به تکمیل فرم جدید توسط متقاضی نیست.
          </Typography>
        </Alert>
      );
      break;
    case 'stage6_committee': {
      const committeeContext = resolveCommitteeContextFromTask(task);
      const hasCommitteeData = Boolean(committeeContext.committee_tracking_no || committeeContext.hearing_at);
      inner = (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: { xs: 2, md: 3 },
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            انتظار پاسخ هیئت تعیین تکلیف
          </Typography>
          <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
            <Typography variant="body2">
              پرونده به هیئت تعیین تکلیف ارسال شده است. این مرحله توسط کاربر مجاز (شرکت / شعبه مرکزی) در موتور
              بررسی می‌شود و نیازی به تکمیل فرم جدید توسط متقاضی نیست.
            </Typography>
          </Alert>
          <Stack spacing={2}>
            {!hasCommitteeData ? (
              <Alert severity="warning" variant="outlined">
                شماره پیگیری و زمان رسیدگی هیئت هنوز ثبت نشده است؛ پس از دریافت پاسخ سازمان دوباره تلاش کنید.
              </Alert>
            ) : (
              <>
                <CommitteeWaitReadOnlyRow
                  label="شماره پیگیری هیئت"
                  value={committeeContext.committee_tracking_no}
                />
                <CommitteeWaitReadOnlyRow
                  label="زمان رسیدگی"
                  value={formatHearingAt(committeeContext.hearing_at)}
                />
              </>
            )}
          </Stack>
        </Box>
      );
      break;
    }
    case 'stage8_objection':
    case 'objection': {
      const objectionContext = resolveObjectionContextFromTask(task);
      const hasObjectionData = Boolean(
        objectionContext.deed_fee ||
          objectionContext.sheba ||
          objectionContext.payment_id ||
          objectionContext.land_owner_fee ||
          objectionContext.registry_status_m13,
      );
      inner = (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: { xs: 2, md: 3 },
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            اعلام وجود/فقدان اعتراض
          </Typography>
          <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
            <Typography variant="body2">
              پس از انتشار آگهی، سازمان وضعیت اعتراض و هزینه‌های صدور سند را اعلام می‌کند. این مرحله
              توسط کاربر مجاز (شرکت / شعبه مرکزی) در موتور بررسی می‌شود.
            </Typography>
          </Alert>
          <Stack spacing={2}>
            {!hasObjectionData ? (
              <Alert severity="warning" variant="outlined">
                اطلاعات هزینه و وضعیت اعتراض هنوز از سازمان دریافت نشده است؛ پس از دریافت پاسخ دوباره
                تلاش کنید.
              </Alert>
            ) : (
              <>
                <CommitteeWaitReadOnlyRow
                  label="وضعیت اعتراض / قطعیت رأی"
                  value={formatObjectionStatus(
                    objectionContext.registry_status_m13 || objectionContext.objection,
                  )}
                />
                <CommitteeWaitReadOnlyRow
                  label="هزینه صدور سند"
                  value={formatFeeAmount(objectionContext.deed_fee)}
                />
                <CommitteeWaitReadOnlyRow
                  label="اجرت/بهای عرصه (ماده ۱۲)"
                  value={formatFeeAmount(objectionContext.land_owner_fee)}
                />
                <CommitteeWaitReadOnlyRow label="شماره شبا" value={objectionContext.sheba} />
                <CommitteeWaitReadOnlyRow label="شناسه پرداخت" value={objectionContext.payment_id} />
                <CommitteeWaitReadOnlyRow
                  label="وضعیت ثبتی (ماده ۱۳)"
                  value={objectionContext.registry_status_m13 || '—'}
                />
              </>
            )}
            {processInstanceId != null ? (
              <Box sx={{ mt: 1, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  سیر مراحل فرایند
                </Typography>
                <ProcessWorkTimeline processInstanceId={processInstanceId} labelsOnly />
              </Box>
            ) : null}
          </Stack>
        </Box>
      );
      break;
    }
    case 'stage10_committee_review': {
      const finalityContext = resolveCourtFinalityContextFromTask(task);
      const hasFinalityData = Boolean(
        finalityContext.court_finality_tracking_no ||
          finalityContext.court_finality_at ||
          finalityContext.court_decision_date,
      );
      inner = (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: { xs: 2, md: 3 },
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            تأیید قطعیت رأی پس از دادگاه
          </Typography>
          <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
            <Typography variant="body2">
              پس از ارسال رأی دادگاه، دبیرخانه قطعیت رأی را بررسی می‌کند. این مرحله توسط کاربر مجاز
              (شرکت / شعبه مرکزی) در موتور بررسی می‌شود و نیازی به تکمیل فرم جدید توسط متقاضی نیست.
            </Typography>
          </Alert>
          <Stack spacing={2}>
            {!hasFinalityData ? (
              <Alert severity="warning" variant="outlined">
                اطلاعات پیگیری قطعیت رأی هنوز از سازمان دریافت نشده است؛ پس از دریافت پاسخ دوباره
                تلاش کنید.
              </Alert>
            ) : (
              <>
                <CommitteeWaitReadOnlyRow
                  label="شماره پیگیری قطعیت رأی"
                  value={finalityContext.court_finality_tracking_no}
                />
                <CommitteeWaitReadOnlyRow
                  label="زمان بررسی دبیرخانه"
                  value={formatHearingAt(finalityContext.court_finality_at)}
                />
                <CommitteeWaitReadOnlyRow
                  label="تاریخ رأی دادگاه"
                  value={finalityContext.court_decision_date}
                />
              </>
            )}
            {processInstanceId != null ? (
              <Box sx={{ mt: 1, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  سیر مراحل فرایند
                </Typography>
                <ProcessWorkTimeline processInstanceId={processInstanceId} labelsOnly />
              </Box>
            ) : null}
          </Stack>
        </Box>
      );
      break;
    }
    case 'stage9_court_decision':
    case 'courtdecision':
      inner = (
        <>
          <CourtDecisionPage />
          {processInstanceId != null ? (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                سیر مراحل فرایند
              </Typography>
              <ProcessWorkTimeline processInstanceId={processInstanceId} labelsOnly />
            </Box>
          ) : null}
        </>
      );
      break;
    case 'form2':
      inner = (
        <Page2Wizard
          taskKind="form2"
          review={form2Review}
          setReview={setForm2Review}
          isVillageProperty={isVillageProperty}
          landOwnerFeeAmount={landOwnerFeeAmount}
          landOwnerFeeSheba={landOwnerFeeSheba}
        />
      );
      break;
    case 'centralreviewform2':
    case 'review2':
      inner = (
        <Page2Wizard
          taskKind="centralReviewForm2"
          review={form2Review}
          setReview={setForm2Review}
          isVillageProperty={isVillageProperty}
          landOwnerFeeAmount={landOwnerFeeAmount}
          landOwnerFeeSheba={landOwnerFeeSheba}
          {...engineReviewProps}
        />
      );
      break;
    case 'tracking':
    case 'registrationtracking':
      inner = <RegistrationTrackingPage />;
      break;
    case 'stage12_issued':
    case 'issued':
      inner = <IssuedDocumentPage />;
      break;
    case 'stage5_expert_visit':
    case 'expertvisit':
      inner = <ExpertVisitPage />;
      break;
    case 'review5':
      inner = (
        <ExpertVisitPage
          taskKind="review5"
          review={expertVisitReview}
          setReview={setExpertVisitReview}
          {...engineReviewProps}
        />
      );
      break;
    case 'stage7_announcement':
    case 'announcement':
      inner = <AnnouncementPage isVillageProperty={isVillageProperty} />;
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
            <UserTaskFooter
              submitting={submitting}
              submitError={submitError}
              onSubmit={submitWithFormValues}
              finalSubmitDisabled={submitLockedForComplete || claimConfirmSubmitLocked}
            />
          ))}
      </Box>
    </FormProvider>
  );
}
