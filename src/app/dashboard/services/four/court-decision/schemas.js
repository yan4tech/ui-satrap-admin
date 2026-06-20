import { z } from 'zod';

import { validateArticle4ExpertNationalId } from '../page1/national-id-validation';

export const SERVICE4_COURT_DECISION_FIELD_SPECS = [
  { key: 'court_decision_date', label: 'تاریخ رأی دادگاه', isImage: false },
  { key: 'court_decision_image', label: 'تصویر رأی دادگاه', isImage: true },
];

export const SERVICE4_COURT_DECISION_EXPERT_FIELD_SPECS = [
  { key: 'expert_national_id', label: 'کد ملی کارشناس امور ثبتی و حقوقی', isImage: false },
  { key: 'expert_objection_rejection_opinion', label: 'نظر کارشناسی مبنی بر رد اعتراض', isImage: false },
  { key: 'expert_objection_description', label: 'توضیحات کارشناس', isImage: false, optional: true },
];

const EXPERT_OBJECTION_REJECTION_RESULT = z.enum(['verified', 'not_verified'], {
  message: 'نظر کارشناسی مبنی بر رد اعتراض الزامی است.',
});

export const SERVICE4_COURT_DECISION_FIELD_KEYS = [
  ...SERVICE4_COURT_DECISION_FIELD_SPECS.map((item) => item.key),
  ...SERVICE4_COURT_DECISION_EXPERT_FIELD_SPECS.map((item) => item.key),
];

function hasUploadedFileValue(value) {
  return (
    (typeof File !== 'undefined' && value instanceof File) ||
    (typeof value === 'string' && value.trim().length > 0) ||
    (value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof value.name === 'string' &&
      value.name.trim().length > 0)
  );
}

function refineService4CourtDecision(data, ctx) {
  for (const spec of SERVICE4_COURT_DECISION_FIELD_SPECS) {
    if (spec.isImage) {
      if (!hasUploadedFileValue(data[spec.key])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${spec.label} الزامی است.`,
          path: [spec.key],
        });
      }
      continue;
    }
    if (!String(data[spec.key] ?? '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${spec.label} الزامی است.`,
        path: [spec.key],
      });
    }
  }

  const expertId = String(data.expert_national_id ?? '').trim();
  if (!expertId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'کد ملی کارشناس امور ثبتی و حقوقی الزامی است.',
      path: ['expert_national_id'],
    });
  } else {
    const expertCheck = validateArticle4ExpertNationalId(expertId);
    if (!expertCheck.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: expertCheck.message ?? 'کد ملی کارشناس معتبر نیست.',
        path: ['expert_national_id'],
      });
    }
  }

  const opinionResult = EXPERT_OBJECTION_REJECTION_RESULT.safeParse(data.expert_objection_rejection_opinion);
  if (!opinionResult.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نظر کارشناسی مبنی بر رد اعتراض الزامی است.',
      path: ['expert_objection_rejection_opinion'],
    });
  } else if (opinionResult.data === 'not_verified') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'در صورت عدم احراز رد اعتراض توسط کارشناس، ادامه فرایند امکان‌پذیر نیست.',
      path: ['expert_objection_rejection_opinion'],
    });
  }
}

const courtDecisionFieldsShape = SERVICE4_COURT_DECISION_FIELD_KEYS.reduce((acc, key) => {
  acc[key] = z.any().optional().nullable();
  return acc;
}, {});

export const service4CourtDecisionSchema = z.object(courtDecisionFieldsShape).superRefine((data, ctx) => {
  refineService4CourtDecision(data, ctx);
});

export function createDefaultCourtDecisionValues() {
  return SERVICE4_COURT_DECISION_FIELD_KEYS.reduce((acc, key) => {
    acc[key] = key.endsWith('_image') ? null : '';
    return acc;
  }, {});
}
