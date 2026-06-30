import { z } from 'zod';

import { validateApplicantNationalId } from './national-id-validation';
import { validateApplicantMobile } from './mobile-validation';
import {
  validateLegalEntityNationalId,
  validateLegalPersonsRegistryRepresentative,
} from './legal-entity-representation-validation';
import { validateSubsidiaryMapManaAccess } from './subsidiary-map-tracking-validation';

const APPLICANT_ROLE = z.enum(
  ['original', 'legal_representative_individual', 'legal_representative_company'],
  { message: 'سمت متقاضی الزامی است' },
);

const SANA_STATUS = z.enum(['registered', 'not_registered'], {
  message: 'وضعیت سامانه ثنا الزامی است',
});

const REPRESENTATION_METHOD = z.enum(['upload_document', 'official_registry'], {
  message: 'نحوه احراز نمایندگی الزامی است',
});

const EXPERT_REPRESENTATION_RESULT = z.enum(['verified', 'not_verified'], {
  message: 'نظر کارشناسی مبنی بر احراز نمایندگی الزامی است',
});

export function shouldRequireExpertRepresentationFields(value) {
  return (
    value.applicant_role === 'legal_representative_individual' ||
    (value.applicant_role === 'legal_representative_company' &&
      value.representation_method === 'upload_document')
  );
}

function refineService4Stage1(value, ctx) {
  if (value.sana_registration_status !== 'registered') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sana_registration_status'],
      message: 'مطابق الزامات، متقاضی باید در سامانه ثنا ثبت‌نام کرده باشد.',
    });
  }

  const eligibility = validateApplicantNationalId(value.national_id);
  if (!eligibility.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['national_id'],
      message: eligibility.message ?? 'کد ملی متقاضی معتبر نیست.',
    });
  }

  if (value.claim_map_match_status === 'no') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['claim_map_match_status'],
      message: 'در صورت عدم تطابق نقشه ادعا، پرونده در این مرحله رد می‌شود.',
    });
  }

  if (value.claim_map_match_status === 'partial') {
    const manaCheck = validateSubsidiaryMapManaAccess(
      value.national_id,
      value.subsidiary_map_tracking_code,
    );
    if (!manaCheck.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subsidiary_map_tracking_code'],
        message: manaCheck.message ?? 'کد رهگیری نقشه فرعی نامعتبر است.',
      });
    }
  }

  if (value.claim_belongs_to_applicant !== 'yes') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['claim_belongs_to_applicant'],
      message: 'ادعا باید متعلق به متقاضی باشد.',
    });
  }

  if (value.eligibility_possession_status !== 'yes') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['eligibility_possession_status'],
      message: 'مطابق الزامات مشمولیت، متقاضی باید دارای تصرف بر ملک باشد.',
    });
  }

  if (value.eligibility_non_agri_land_without_building !== 'no') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['eligibility_non_agri_land_without_building'],
      message: 'زمین غیرکشاورزی فاقد ساختمان در این خدمت مشمول نیست.',
    });
  }

  if (value.eligibility_official_owner_access_status === 'none') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['eligibility_official_owner_access_status'],
      message: 'گزینه «هیچکدام» قابل پذیرش نیست؛ وضعیت دسترسی به مالک رسمی را مشخص کنید.',
    });
  }

  if (value.applicant_role === 'legal_representative_company') {
    const entityId = String(value.legal_entity_national_id ?? '').trim();
    if (!entityId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['legal_entity_national_id'],
        message: 'شناسه ملی شخص حقوقی الزامی است.',
      });
    } else {
      const entityCheck = validateLegalEntityNationalId(entityId);
      if (!entityCheck.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legal_entity_national_id'],
          message: entityCheck.message ?? 'شناسه ملی شخص حقوقی نامعتبر است.',
        });
      }
    }

    const methodResult = REPRESENTATION_METHOD.safeParse(value.representation_method);
    if (!methodResult.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['representation_method'],
        message: 'نحوه احراز نمایندگی الزامی است.',
      });
    } else if (methodResult.data === 'official_registry') {
      const registryCheck = validateLegalPersonsRegistryRepresentative(
        value.national_id,
        entityId,
      );
      if (!registryCheck.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['representation_method'],
          message: registryCheck.message ?? 'احراز نمایندگی از پایگاه اشخاص حقوقی ناموفق بود.',
        });
      }
    } else if (methodResult.data === 'upload_document') {
      if (!String(value.representation_doc_date ?? '').trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['representation_doc_date'],
          message: 'تاریخ تنظیم سند نمایندگی الزامی است.',
        });
      }

      if (!String(value.representation_doc_id ?? '').trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['representation_doc_id'],
          message: 'شناسه سند رسمی نمایندگی الزامی است.',
        });
      }

      if (!String(value.verification_code ?? '').trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['verification_code'],
          message: 'رمز تصدیق الزامی است.',
        });
      }

      const docImage = value.representation_doc_image;
      const hasDocImage =
        (typeof File !== 'undefined' && docImage instanceof File) ||
        (typeof docImage === 'string' && docImage.trim().length > 0);
      if (!hasDocImage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['representation_doc_image'],
          message: 'تصویر سند نمایندگی الزامی است.',
        });
      }
    }
  }

  if (value.applicant_role === 'legal_representative_individual') {
    const principalId = String(value.national_id_asil ?? '').trim();
    if (!principalId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['national_id_asil'],
        message: 'کد ملی اصیل الزامی است.',
      });
    } else {
      const principalCheck = validateApplicantNationalId(principalId);
      if (!principalCheck.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['national_id_asil'],
          message: principalCheck.message ?? 'کد ملی اصیل معتبر نیست.',
        });
      }
    }

    const principalPostal = String(value.principal_postal_code ?? '').trim();
    if (!principalPostal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['principal_postal_code'],
        message: 'کد پستی اصیل الزامی است.',
      });
    } else if (!/^\d{10}$/.test(principalPostal)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['principal_postal_code'],
        message: 'کد پستی اصیل باید ۱۰ رقم باشد.',
      });
    }

    if (!String(value.representation_doc_date ?? '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['representation_doc_date'],
        message: 'تاریخ تنظیم سند نمایندگی الزامی است.',
      });
    }

    if (!String(value.representation_doc_id ?? '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['representation_doc_id'],
        message: 'شناسه سند رسمی نمایندگی الزامی است.',
      });
    }

    if (!String(value.verification_code ?? '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['verification_code'],
        message: 'رمز تصدیق الزامی است.',
      });
    }

    const docImage = value.representation_doc_image;
    const hasDocImage =
      (typeof File !== 'undefined' && docImage instanceof File) ||
      (typeof docImage === 'string' && docImage.trim().length > 0);
    if (!hasDocImage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['representation_doc_image'],
        message: 'تصویر سند رسمی نمایندگی الزامی است.',
      });
    }
  }

  if (shouldRequireExpertRepresentationFields(value)) {
    const expertId = String(value.legal_expert_national_id ?? '').trim();
    if (!expertId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['legal_expert_national_id'],
        message: 'کد ملی کارشناس امور ثبتی و حقوقی الزامی است.',
      });
    } else if (!/^\d{10}$/.test(expertId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['legal_expert_national_id'],
        message: 'کد ملی کارشناس باید ۱۰ رقم باشد.',
      });
    } else {
      const expertCheck = validateApplicantNationalId(expertId);
      if (!expertCheck.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legal_expert_national_id'],
          message: expertCheck.message ?? 'کد ملی کارشناس معتبر نیست.',
        });
      }
    }

    const opinionResult = EXPERT_REPRESENTATION_RESULT.safeParse(value.expert_representation_result);
    if (!opinionResult.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expert_representation_result'],
        message: 'نظر کارشناسی مبنی بر احراز نمایندگی الزامی است.',
      });
    } else if (opinionResult.data === 'not_verified') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expert_representation_result'],
        message: 'در صورت عدم احراز نمایندگی توسط کارشناس، ادامه فرایند امکان‌پذیر نیست.',
      });
    }
  }
}

// ---------------- STEP 0 (متقاضی) ----------------
export const step0Schema = z
  .object({
    service_type: z.literal(4, { message: 'نوع خدمت باید خدمت چهارم باشد.' }),
    national_id: z.string().regex(/^\d{10}$/, 'کد ملی باید ۱۰ رقم باشد'),
    mobile: z.string().regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است'),
    sana_registration_status: SANA_STATUS,
    applicant_role: APPLICANT_ROLE,
    postal_code: z.string().regex(/^\d{10}$/, 'کد پستی باید ۱۰ رقم باشد'),
  })
  .superRefine((value, ctx) => {
    const eligibility = validateApplicantNationalId(value.national_id);
    if (!eligibility.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['national_id'],
        message: eligibility.message ?? 'کد ملی متقاضی معتبر نیست.',
      });
    }

    const mobileCheck = validateApplicantMobile(value.national_id, value.mobile);
    if (!mobileCheck.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mobile'],
        message: mobileCheck.message ?? 'شماره موبایل نامعتبر است',
      });
    }

    if (value.sana_registration_status !== 'registered') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sana_registration_status'],
        message: 'مطابق الزامات، متقاضی باید در سامانه ثنا ثبت‌نام کرده باشد.',
      });
    }
  });

// ---------------- STEP 1 (ادعا + نمایندگی + مشمولیت) ----------------
export const step1Schema = z.object({
  is_claimant_deceased: z.enum(['yes', 'no']).optional(),
  claim_registration_tracking_code: z.string().min(1, 'کد رهگیری درج ادعا الزامی است'),
  deceased_national_id: z.string().optional(),
  deceased_date: z.string().optional(),
  claim_map_match_status: z.enum(['yes', 'partial', 'no'], {
    message: 'وضعیت تطابق نقشه ادعا الزامی است',
  }),
  subsidiary_map_tracking_code: z.string().optional(),
  claim_ownership_type: z.literal('ownership_of_ain', {
    errorMap: () => ({ message: 'نوع ادعا باید مالکیت عین باشد.' }),
  }),
  claim_belongs_to_applicant: z.enum(['yes', 'no'], {
    message: 'وضعیت تعلق ادعا به متقاضی الزامی است',
  }),
  eligibility_possession_status: z.enum(['yes', 'no'], {
    message: 'وضعیت تصرف الزامی است',
  }),
  eligibility_non_agri_land_without_building: z.enum(['yes', 'no'], {
    message: 'وضعیت زمین غیرکشاورزی فاقد ساختمان الزامی است',
  }),
  eligibility_official_owner_access_status: z.enum(
    ['owner_contact_established', 'owner_deceased', 'owner_location_unknown', 'none'],
    { message: 'وضعیت دسترسی به مالک رسمی الزامی است' },
  ),
  legal_entity_national_id: z.string().optional(),
  representation_method: z.string().optional(),
  national_id_asil: z.string().optional(),
  principal_postal_code: z.string().optional(),
  representation_doc_date: z.string().optional(),
  representation_doc_id: z.string().optional(),
  verification_code: z.string().optional(),
  representation_doc_image: z.any().optional().nullable(),
  legal_expert_national_id: z.string().optional(),
  expert_representation_result: z.string().optional(),
  expert_description: z.string().optional(),
});

// ---------------- STEP 2 (اطلاعات مکانی) ----------------
export const step2Schema = z.object({});

// ---------------- STEP 3 (ملک + مالی) ----------------
export const step3Schema = z.object({
  total_amount: z.coerce.number().min(0, 'مبلغ کل باید مثبت باشد').optional(),
  discount: z.coerce.number().min(0).optional().default(0),
  final_amount: z.coerce.number().min(0).optional(),
  extra_description: z.string().optional(),
  attachment: z.string().optional(),
});

// ---------------- STEP 4 ----------------
export const step4Schema = z.object({
  has_map_access_request: z.enum(['yes', 'no']).optional(),
  access_people: z.array(z.string()).optional().default([]),
});

// ---------------- STEP 5 ----------------
export const step5Schema = z.object({
  survey_assignment: z.string().optional(),
});

// ---------------- REVIEW ----------------
export const reviewStatusSchema = z.enum(['pending', 'approved', 'rejected', 'needs_correction']);

export const reviewStepSchema = z
  .object({
    status: reviewStatusSchema,
    comment: z.string().optional().default(''),
  })
  .superRefine((value, ctx) => {
    const mustHaveComment = value.status === 'rejected' || value.status === 'needs_correction';
    if (mustHaveComment && !value.comment?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['comment'],
        message: 'برای رد یا نیاز به اصلاح، توضیح الزامی است',
      });
    }
  });

export const reviewSchema = z.object({
  step0: reviewStepSchema,
  step1: reviewStepSchema,
  step2: reviewStepSchema,
  step3: reviewStepSchema,
  step4: reviewStepSchema,
});

// ---------------- STAGE 1 (مرحله اول فرایند) ----------------
export const service4Stage1Schema = step0Schema.merge(step1Schema).superRefine(refineService4Stage1);

// ---------------- EXPORT ARRAY ----------------
export const stepSchemas = [
  step0Schema,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
];
