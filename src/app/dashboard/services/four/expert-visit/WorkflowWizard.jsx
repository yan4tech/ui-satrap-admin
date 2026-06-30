'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Step,
  StepButton,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';

import { sanitizeValuesForEngineJson } from '../../one/engine-api';

import BoundarySidesStep from './steps/BoundarySidesStep';
import WitnessesStep from './steps/WitnessesStep';
import ExpertAssignmentStep from './steps/ExpertAssignmentStep';
import OwnershipTransferStep from './steps/OwnershipTransferStep';
import PossessionVerificationStep from './steps/PossessionVerificationStep';
import LandOwnerContractStep from './steps/LandOwnerContractStep';
import ExpertRegionalValueStep from './steps/ExpertRegionalValueStep';
import OtherDocumentsInquiriesStep from './steps/OtherDocumentsInquiriesStep';
import PropertyGeneralInfoStep from './steps/PropertyGeneralInfoStep';
import AgriculturalLandPropertyDetailsStep from './steps/AgriculturalLandPropertyDetailsStep';
import BuildingPropertyDetailsStep from './steps/BuildingPropertyDetailsStep';
import GardenPropertyDetailsStep from './steps/GardenPropertyDetailsStep';
import EasementRightsStep from './steps/EasementRightsStep';
import PropertyRegistryInfoStep from './steps/PropertyRegistryInfoStep';
import RegistryInquiryIssueStep from './steps/RegistryInquiryIssueStep';
import VisitScheduleStep from './steps/VisitScheduleStep';

import { isService4ImprovementClaim, isService4RegionalValueDetermined } from './schemas';

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

const defaultReview = { status: REVIEW_STATUS.PENDING, comment: '' };

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

const VISIT_SECTIONS = [
  { key: 'registryInquiryIssue', title: 'استعلام ثبت', Component: RegistryInquiryIssueStep },
  { key: 'expertAssignment', title: 'تخصیص کارشناس', Component: ExpertAssignmentStep, whenCannotIssue: false },
  { key: 'visitSchedule', title: 'تاریخ و حضور بازدید', Component: VisitScheduleStep, whenCannotIssue: false },
  {
    key: 'propertyGeneralInfo',
    title: 'اطلاعات کلی ملک',
    Component: PropertyGeneralInfoStep,
    whenCannotIssue: false,
  },
  {
    key: 'buildingPropertyDetails',
    title: 'جزئیات ساختمان',
    Component: BuildingPropertyDetailsStep,
    whenCannotIssue: false,
    whenPropertyType: 'building',
  },
  {
    key: 'agriculturalLandPropertyDetails',
    title: 'جزئیات زمین مزروعی',
    Component: AgriculturalLandPropertyDetailsStep,
    whenCannotIssue: false,
    whenPropertyType: 'agricultural_land',
  },
  {
    key: 'gardenPropertyDetails',
    title: 'جزئیات باغ',
    Component: GardenPropertyDetailsStep,
    whenCannotIssue: false,
    whenPropertyType: 'garden',
  },
  {
    key: 'easementRights',
    title: 'حقوق ارتفاقی مجاورین/ارتفاقی ملک',
    Component: EasementRightsStep,
    whenCannotIssue: false,
    whenNeighborEasement: true,
  },
  {
    key: 'propertyRegistryInfo',
    title: 'پلاک و اطلاعات ثبتی',
    Component: PropertyRegistryInfoStep,
    whenCannotIssue: false,
  },
  {
    key: 'boundarySides',
    title: 'اضلاع ملک (شمال، جنوب، شرق، غرب)',
    Component: BoundarySidesStep,
    whenCannotIssue: false,
  },
  {
    key: 'witnesses',
    title: 'شهود (حداقل ۴ نفر)',
    Component: WitnessesStep,
    whenCannotIssue: false,
  },
  {
    key: 'ownershipTransfer',
    title: 'نحوه انتقال و مستند مالکیت',
    Component: OwnershipTransferStep,
    whenCannotIssue: false,
  },
  {
    key: 'possessionVerification',
    title: 'گزارش احراز تصرف',
    Component: PossessionVerificationStep,
    whenCannotIssue: false,
  },
  {
    key: 'landOwnerContract',
    title: 'مستندات رابطه قراردادی با مالک عرصه',
    Component: LandOwnerContractStep,
    whenCannotIssue: false,
    whenImprovementClaim: true,
  },
  {
    key: 'expertRegionalValue',
    title: 'ارزش منطقه‌ای کارشناس',
    Component: ExpertRegionalValueStep,
    whenCannotIssue: false,
    whenRegionalValueNotDetermined: true,
  },
  {
    key: 'otherDocumentsInquiries',
    title: 'سایر مستندات و استعلامات',
    Component: OtherDocumentsInquiriesStep,
    whenCannotIssue: false,
  },
];

function filterVisitSections({
  terminatesProcess,
  propertyType,
  neighborEasement,
  isImprovementClaim,
  isRegionalValueDetermined,
}) {
  return VISIT_SECTIONS.filter(
    (section) =>
      (section.whenCannotIssue !== false || !terminatesProcess) &&
      (!section.whenPropertyType || section.whenPropertyType === propertyType) &&
      (!section.whenNeighborEasement || neighborEasement === 'yes') &&
      (!section.whenImprovementClaim || isImprovementClaim) &&
      (!section.whenRegionalValueNotDetermined || !isRegionalValueDetermined),
  );
}

export default function ExpertVisitWorkflowWizard({
  taskKind,
  review: reviewProp,
  setReview: setReviewProp,
  onEngineStepSubmit,
  engineSubmitting = false,
  engineSubmitError,
  finalSubmitDisabled = false,
} = {}) {
  const formMethods = useFormContext();
  const [internalReview, setInternalReview] = useState(defaultReview);
  const review = reviewProp !== undefined ? reviewProp : internalReview;
  const setReview = setReviewProp ?? setInternalReview;
  const patchReview = useCallback(
    (partial) => {
      setReview((prev) => ({ ...prev, ...partial }));
    },
    [setReview],
  );

  const isReviewer = taskKind === 'review5';

  const canFinalizeReview = useMemo(() => {
    if (!isReviewer) return false;
    if (review.status === REVIEW_STATUS.REJECTED || review.status === REVIEW_STATUS.NEEDS_CORRECTION) {
      return Boolean(review.comment.trim());
    }
    return review.status !== REVIEW_STATUS.PENDING;
  }, [isReviewer, review]);

  const handleFinalizeReview = async () => {
    if (!canFinalizeReview || typeof onEngineStepSubmit !== 'function') return;
    const comment = (review.comment || '').trim();
    let ok = false;
    if (review.status === REVIEW_STATUS.APPROVED) {
      const taskFormPayload = sanitizeValuesForEngineJson(formMethods.getValues());
      ok = await onEngineStepSubmit({
        engineReviewDecision: 'approved',
        review_comment: comment || 'ok',
        taskFormPayload,
      });
    } else if (review.status === REVIEW_STATUS.NEEDS_CORRECTION) {
      ok = await onEngineStepSubmit({ engineReviewDecision: 'correction', comment });
    } else if (review.status === REVIEW_STATUS.REJECTED) {
      ok = await onEngineStepSubmit({ engineReviewDecision: 'rejected', comment });
    }
    if (ok && review.status === REVIEW_STATUS.APPROVED) {
      patchReview({ status: REVIEW_STATUS.APPROVED });
    }
  };

  const cannotIssue = useWatch({ name: 'expertVisit.registry_inquiry_cannot_issue' });
  const propertyType = useWatch({ name: 'expertVisit.visit_property_type' });
  const neighborEasement = useWatch({ name: 'expertVisit.visit_neighbor_easement_rights' });
  const claimPropertyOwnershipType = useWatch({ name: 'expertVisit.claim_property_ownership_type' });
  const regionalValue = useWatch({ name: 'expertVisit.regional_value' });
  const regionalValueDetermined = useWatch({ name: 'expertVisit.regional_value_determined' });

  const terminatesProcess = cannotIssue === 'yes';
  const isImprovementClaim = isService4ImprovementClaim(claimPropertyOwnershipType);
  const isRegionalValueDetermined = isService4RegionalValueDetermined({
    regional_value: regionalValue,
    regional_value_determined: regionalValueDetermined,
  });

  const visibleSections = useMemo(
    () =>
      filterVisitSections({
        terminatesProcess,
        propertyType,
        neighborEasement,
        isImprovementClaim,
        isRegionalValueDetermined,
      }),
    [
      terminatesProcess,
      propertyType,
      neighborEasement,
      isImprovementClaim,
      isRegionalValueDetermined,
    ],
  );

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setActiveStep((prev) => {
      if (visibleSections.length === 0) return 0;
      return Math.min(prev, visibleSections.length - 1);
    });
  }, [visibleSections.length]);

  const currentSection = visibleSections[activeStep] ?? visibleSections[0] ?? null;
  const isFirstStep = activeStep <= 0;
  const isLastStep = activeStep >= visibleSections.length - 1;

  const handlePrev = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setActiveStep((prev) => Math.min(visibleSections.length - 1, prev + 1));
  };

  return (
    <Container maxWidth={false} disableGutters dir="rtl" sx={{ py: 1 }}>
      <Card
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: (theme) => theme.shadows[1],
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {engineSubmitError && isReviewer ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {engineSubmitError}
            </Alert>
          ) : null}
          <Typography variant="h5" textAlign="center" mb={2}>
            {isReviewer ? 'تایید بازدید کارشناس قبل از ارسال به سازمان' : 'بازدید کارشناس امور ثبتی و حقوقی'}
          </Typography>

          {!isReviewer ? (
          <Alert severity="info" variant="outlined" sx={{ mb: 3 }}>
            ابتدا وضعیت امکان صدور از استعلام ثبت را مشخص کنید. در صورت «عدم امکان صدور»، فرایند در همین
            مرحله خاتمه می‌یابد؛ در غیر این صورت کارشناس مجاز (ماده ۴ دستورالعمل) را تخصیص دهید، تاریخ بازدید
            را ثبت کنید، حضور شخصی کارشناس در محل را تأیید کنید و اطلاعات کلی ملک (تطابق تصرف با نقشه و در صورت عدم تطابق کامل، کد رهگیری نقشه اصلاحی، نوع ملک،
            کاربری، حقوق ارتفاقی مجاورین (در صورت «بلی»: نوع، موقعیت، شرح و مستند)، پلاک، بخش ثبتی، سهم مشاعی، نسبت تصرف به سهم، اضلاع ملک (نوع حد، پلاک مجاور،
            عنوان مجاور)، شهود (نام، کد ملی، موبایل، تصاویر کارت ملی و گواهی)، نحوه انتقال و مستند مالکیت، و گزارش احراز تصرف (محرز شد/نشد، تصویر محل، توضیحات)
            {isImprovementClaim
              ? ' و در صورت ادعای اعیان، مستندات رابطه قراردادی با مالک عرصه'
              : ''}
            {isRegionalValueDetermined ? '' : ' و در صورت عدم تعیین ارزش منطقه‌ای در استعلام ثبت، ارزش منطقه‌ای کارشناس'}
            {' و در صورت نیاز، سایر مستندات و استعلامات'}
            را وارد نمایید.
          </Alert>
          ) : (
            <Alert severity="info" variant="outlined" sx={{ mb: 3 }}>
              داده‌های بازدید کارشناس را بررسی کنید. پس از تایید، اطلاعات یکجا به سازمان ارسال می‌شود.
            </Alert>
          )}

          {!isReviewer && terminatesProcess ? (
            <Alert severity="warning" variant="outlined" sx={{ mb: 3 }}>
              با انتخاب «بلی»، پس از «ثبت نهایی» فرایند متوقف می‌شود و مراحل بعدی انجام نخواهد شد.
            </Alert>
          ) : null}

          {visibleSections.length > 0 ? (
            <Box sx={{ position: 'relative' }}>
              <Stepper
                nonLinear
                activeStep={activeStep}
                alternativeLabel
                sx={{
                  mb: 3,
                  px: { xs: 0, md: 0.5 },
                  overflowX: 'auto',
                  '& .MuiStepLabel-label': {
                    fontWeight: 600,
                    fontSize: { xs: '0.68rem', sm: '0.75rem' },
                    whiteSpace: 'nowrap',
                  },
                  '& .MuiStepLabel-label.Mui-active': {
                    color: 'primary.main',
                    fontWeight: 800,
                  },
                  '& .MuiStepLabel-label.Mui-completed': {
                    color: 'success.main',
                  },
                }}
              >
                {visibleSections.map((section, index) => (
                  <Step key={section.key} completed={index < activeStep}>
                    <StepButton
                      onClick={() => setActiveStep(index)}
                      sx={{
                        borderRadius: 2,
                        minWidth: { xs: 72, sm: 96 },
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <StepLabel>{section.title}</StepLabel>
                    </StepButton>
                  </Step>
                ))}
              </Stepper>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                بخش {activeStep + 1} از {visibleSections.length}
                {currentSection?.title ? ` — ${currentSection.title}` : ''}
              </Typography>

              {currentSection ? (
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', minHeight: 200 }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    {currentSection.title}
                  </Typography>
                  <fieldset disabled={isReviewer} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
                    <currentSection.Component />
                  </fieldset>
                </Box>
              ) : null}

              {!isReviewer && visibleSections.length > 1 ? (
                <Stack
                  direction={{ xs: 'column-reverse', sm: 'row' }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  sx={{ mt: 3 }}
                >
                  <Button variant="outlined" onClick={handlePrev} disabled={isFirstStep} sx={{ minWidth: 120 }}>
                    قبلی
                  </Button>

                  {isLastStep ? (
                    <Typography variant="body2" color="text.secondary" textAlign={{ xs: 'center', sm: 'right' }}>
                      پس از تکمیل همه بخش‌ها، «ثبت نهایی» را در پایین صفحه بزنید.
                    </Typography>
                  ) : (
                    <Button variant="contained" onClick={handleNext} sx={{ minWidth: 120 }}>
                      بعدی
                    </Button>
                  )}
                </Stack>
              ) : null}

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
          ) : null}

          {isReviewer ? (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: 2,
                mt: 3,
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                نتیجه بررسی کل فرم
              </Typography>
              <ReviewDecisionCard
                review={review}
                isReviewer={isReviewer}
                onStatusChange={(status) => patchReview({ status })}
                onCommentChange={(comment) => patchReview({ comment })}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  type="button"
                  variant="contained"
                  color="success"
                  sx={{ minWidth: 220 }}
                  disabled={!canFinalizeReview || engineSubmitting || finalSubmitDisabled}
                  onClick={() => void handleFinalizeReview()}
                >
                  {engineSubmitting ? 'در حال ثبت…' : 'ثبت نهایی'}
                </Button>
              </Box>
            </Box>
          ) : null}
        </CardContent>
      </Card>
    </Container>
  );
}
