import { z } from 'zod';

import { validateArticle4ExpertNationalId, validateApplicantNationalId } from '../page1/national-id-validation';
import { validateApplicantMobile } from '../page1/mobile-validation';
import { validateSubsidiaryMapManaAccess } from '../page1/subsidiary-map-tracking-validation';

const yesNoRequired = z.enum(['yes', 'no'], {
  required_error: 'پاسخ به سؤال «عدم امکان صدور از استعلام ثبت» الزامی است.',
  invalid_type_error: 'پاسخ به سؤال «عدم امکان صدور از استعلام ثبت» الزامی است.',
});

const VISIT_PROPERTY_TYPES = [
  'land',
  'apartment',
  'villa',
  'building',
  'agricultural_land',
  'garden',
  'other',
];

const VISIT_PROPERTY_USAGES = ['residential', 'commercial', 'administrative', 'agricultural', 'other'];

const VISIT_OWNERSHIP_TRANSFER_TYPES = [
  'sale',
  'gift',
  'inheritance',
  'court_ruling',
  'endowment',
  'lease_to_own',
  'other',
];

const VISIT_OWNERSHIP_DOCUMENT_TYPES = [
  'official_deed',
  'preliminary_contract',
  'inheritance_certificate',
  'court_ruling',
  'endowment_deed',
  'other',
];

const VISIT_POSSESSION_VERIFICATION_STATUSES = ['established', 'not_established'];

const VISIT_BOUNDARY_TYPES = [
  'natural',
  'artificial',
  'passage',
  'neighbor_property',
  'river',
  'other',
];

export const VISIT_BOUNDARY_DIRECTIONS = [
  { value: 'north', label: 'شمال' },
  { value: 'south', label: 'جنوب' },
  { value: 'east', label: 'شرق' },
  { value: 'west', label: 'غرب' },
];

export const MIN_VISIT_WITNESS_COUNT = 4;

export const MIN_VISIT_EASEMENT_COUNT = 1;

export const SERVICE4_IMPROVEMENT_CLAIM_TYPES = new Set([
  'improvement',
  'land_and_improvement',
  'share_and_improvement',
  'اعیان',
  'عرصه و اعیان',
  'سهم و اعیان',
]);

export function isService4ImprovementClaim(claimType) {
  return SERVICE4_IMPROVEMENT_CLAIM_TYPES.has(String(claimType ?? '').trim());
}

export function isService4RegionalValueDetermined(data) {
  const flag = String(data?.regional_value_determined ?? '')
    .trim()
    .toLowerCase();
  if (flag === 'yes' || flag === 'true' || flag === '1') {
    return true;
  }
  if (flag === 'no' || flag === 'false' || flag === '0') {
    return false;
  }

  const registryResponse =
    data?.registry_response && typeof data.registry_response === 'object'
      ? data.registry_response
      : null;
  const rawValue = data?.regional_value ?? registryResponse?.regional_value;
  if (rawValue == null || rawValue === '') {
    return false;
  }
  const numeric = Number(String(rawValue).replace(/,/g, '').trim());
  if (!Number.isNaN(numeric) && numeric > 0) {
    return true;
  }
  return String(rawValue).trim() !== '' && String(rawValue).trim() !== '0';
}

function refineExpertVisitRegionalValue(data, ctx) {
  if (data.registry_inquiry_cannot_issue === 'yes') {
    return;
  }
  if (isService4RegionalValueDetermined(data)) {
    return;
  }
  const raw = String(data.visit_expert_regional_value ?? '')
    .replace(/,/g, '')
    .trim();
  const amount = Number(raw);
  if (!raw || Number.isNaN(amount) || amount <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ارزش منطقه‌ای کارشناس الزامی است.',
      path: ['visit_expert_regional_value'],
    });
  }
}

export const VISIT_LAND_OWNER_CONTRACT_TYPES = [
  { value: 'lease', label: 'اجاره' },
  { value: 'sale_improvement_rights', label: 'معامله حقوق اعیان' },
  { value: 'rent_to_own', label: 'اجاره به شرط تملیک' },
  { value: 'permission', label: 'اجازه/رضایت مالک عرصه' },
  { value: 'other', label: 'سایر' },
];

export const VISIT_EASEMENT_TYPES = [
  { value: 'passage', label: 'حق عبور' },
  { value: 'water', label: 'حق آب' },
  { value: 'drainage', label: 'حق آبرو/زهکش' },
  { value: 'view_light', label: 'حق نور و زیبایی' },
  { value: 'utility', label: 'حق انشعاب/تاسیسات' },
  { value: 'neighbor_easement', label: 'حق ارتفاقی مجاور' },
  { value: 'property_easement', label: 'ارتفاقی ملک' },
  { value: 'other', label: 'سایر' },
];

export const VISIT_OTHER_ENTRY_TYPES = [
  { value: 'document', label: 'مستند' },
  { value: 'inquiry', label: 'استعلام' },
];

export function createEmptyVisitOtherDocumentInquiry() {
  return {
    entry_type: '',
    title: '',
    reference_date: '',
    description: '',
    attachment_image: null,
  };
}

export function isVisitOtherDocumentInquiryItemEmpty(item) {
  if (!item || typeof item !== 'object') return true;
  if (String(item.entry_type ?? '').trim()) return false;
  if (String(item.title ?? '').trim()) return false;
  if (String(item.reference_date ?? '').trim()) return false;
  if (String(item.description ?? '').trim()) return false;
  return !hasUploadedFileValue(item.attachment_image);
}

export function normalizeVisitOtherDocumentsInquiries(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => ({
      entry_type: String(item?.entry_type ?? '').trim(),
      title: String(item?.title ?? '').trim(),
      reference_date: String(item?.reference_date ?? '').trim(),
      description: String(item?.description ?? '').trim(),
      attachment_image: item?.attachment_image ?? null,
    }))
    .filter((item) => !isVisitOtherDocumentInquiryItemEmpty(item));
}

export function createEmptyVisitWitness() {
  return {
    name: '',
    national_id: '',
    mobile: '',
    national_card_image: null,
    certificate_image: null,
  };
}

export function createDefaultVisitWitnesses() {
  return Array.from({ length: MIN_VISIT_WITNESS_COUNT }, () => createEmptyVisitWitness());
}

export function createEmptyVisitEasement() {
  return {
    easement_type: '',
    location: '',
    description: '',
    document_image: null,
  };
}

export function createDefaultVisitEasementRights() {
  return [createEmptyVisitEasement()];
}

export function normalizeVisitEasementRights(items) {
  const list = Array.isArray(items)
    ? items.map((item) => ({
        easement_type: String(item?.easement_type ?? '').trim(),
        location: String(item?.location ?? '').trim(),
        description: String(item?.description ?? '').trim(),
        document_image: item?.document_image ?? null,
      }))
    : [];
  if (list.length === 0) {
    return createDefaultVisitEasementRights();
  }
  return list;
}

export function normalizeVisitWitnesses(witnesses) {
  const list = Array.isArray(witnesses)
    ? witnesses.map((item) => ({
        name: String(item?.name ?? '').trim(),
        national_id: String(item?.national_id ?? '').trim(),
        mobile: String(item?.mobile ?? '').trim(),
        national_card_image: item?.national_card_image ?? null,
        certificate_image: item?.certificate_image ?? null,
      }))
    : [];
  while (list.length < MIN_VISIT_WITNESS_COUNT) {
    list.push(createEmptyVisitWitness());
  }
  return list;
}

export function createDefaultVisitBoundarySides() {
  return VISIT_BOUNDARY_DIRECTIONS.map(({ value }) => ({
    direction: value,
    boundary_type: '',
    adjacent_plaque: '',
    adjacent_title: '',
  }));
}

export function normalizeVisitBoundarySides(sides) {
  const byDirection = {};
  if (Array.isArray(sides)) {
    sides.forEach((item) => {
      const direction = String(item?.direction ?? '').trim();
      if (direction) {
        byDirection[direction] = item;
      }
    });
  }
  return VISIT_BOUNDARY_DIRECTIONS.map(({ value }) => ({
    direction: value,
    boundary_type: String(byDirection[value]?.boundary_type ?? '').trim(),
    adjacent_plaque: String(byDirection[value]?.adjacent_plaque ?? '').trim(),
    adjacent_title: String(byDirection[value]?.adjacent_title ?? '').trim(),
  }));
}

function hasUploadedFileValue(value) {
  return (
    (typeof File !== 'undefined' && value instanceof File) ||
    (typeof value === 'string' && value.trim().length > 0)
  );
}

function parsePositiveInt(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function validateShareFraction(data, ctx, totalKey, partialKey, sectionLabel) {
  const total = parsePositiveInt(data[totalKey]);
  const partial = parsePositiveInt(data[partialKey]);

  if (total === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `تعداد سهم کل ${sectionLabel} الزامی است.`,
      path: [totalKey],
    });
  }
  if (partial === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `تعداد سهم جزء ${sectionLabel} الزامی است.`,
      path: [partialKey],
    });
  }
  if (total !== null && partial !== null && partial > total) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `سهم جزء ${sectionLabel} نمی‌تواند از سهم کل بیشتر باشد.`,
      path: [partialKey],
    });
  }
}

function refineExpertVisitRegistryInfo(data, ctx) {
  if (data.registry_inquiry_cannot_issue === 'yes') {
    return;
  }

  if (!String(data.visit_main_plaque_number ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'پلاک ثبتی اصلی الزامی است.',
      path: ['visit_main_plaque_number'],
    });
  }

  if (!String(data.visit_registration_section ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'بخش ثبتی الزامی است.',
      path: ['visit_registration_section'],
    });
  }

  validateShareFraction(data, ctx, 'visit_joint_share_total', 'visit_joint_share_partial', 'سهم مشاعی');
  validateShareFraction(
    data,
    ctx,
    'visit_possession_to_share_total',
    'visit_possession_to_share_partial',
    'نسبت تصرف به سهم',
  );
}

function refineExpertVisitOwnershipTransfer(data, ctx) {
  if (data.registry_inquiry_cannot_issue === 'yes') {
    return;
  }

  const transferType = String(data.visit_ownership_transfer_type ?? '').trim();
  if (!transferType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نحوه انتقال الزامی است.',
      path: ['visit_ownership_transfer_type'],
    });
  } else if (!VISIT_OWNERSHIP_TRANSFER_TYPES.includes(transferType)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نحوه انتقال انتخاب‌شده نامعتبر است.',
      path: ['visit_ownership_transfer_type'],
    });
  }

  const documentType = String(data.visit_ownership_document_type ?? '').trim();
  if (!documentType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نوع مستند مالکیت الزامی است.',
      path: ['visit_ownership_document_type'],
    });
  } else if (!VISIT_OWNERSHIP_DOCUMENT_TYPES.includes(documentType)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نوع مستند مالکیت انتخاب‌شده نامعتبر است.',
      path: ['visit_ownership_document_type'],
    });
  }

  if (!String(data.visit_ownership_document_date ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'تاریخ مستند مالکیت الزامی است.',
      path: ['visit_ownership_document_date'],
    });
  }

  if (!hasUploadedFileValue(data.visit_ownership_document_image)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'تصویر مستند مالکیت الزامی است.',
      path: ['visit_ownership_document_image'],
    });
  }

  if (!String(data.visit_last_official_owner ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'آخرین مالک رسمی الزامی است.',
      path: ['visit_last_official_owner'],
    });
  }
}

function refineExpertVisitPossessionVerification(data, ctx) {
  if (data.registry_inquiry_cannot_issue === 'yes') {
    return;
  }

  const status = String(data.visit_possession_verification_status ?? '').trim();
  if (!status) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نتیجه احراز تصرف (محرز شد/نشد) الزامی است.',
      path: ['visit_possession_verification_status'],
    });
  } else if (!VISIT_POSSESSION_VERIFICATION_STATUSES.includes(status)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نتیجه احراز تصرف انتخاب‌شده نامعتبر است.',
      path: ['visit_possession_verification_status'],
    });
  }

  if (!hasUploadedFileValue(data.visit_possession_location_image)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'تصویر محل تصرف الزامی است.',
      path: ['visit_possession_location_image'],
    });
  }
}

function refineExpertVisitBoundarySides(data, ctx) {
  if (data.registry_inquiry_cannot_issue === 'yes') {
    return;
  }

  const sides = normalizeVisitBoundarySides(data.visit_boundary_sides);
  sides.forEach((side, index) => {
    const directionLabel =
      VISIT_BOUNDARY_DIRECTIONS.find((item) => item.value === side.direction)?.label ?? side.direction;

    if (!side.boundary_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `نوع حد ضلع ${directionLabel} الزامی است.`,
        path: ['visit_boundary_sides', index, 'boundary_type'],
      });
    } else if (!VISIT_BOUNDARY_TYPES.includes(side.boundary_type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `نوع حد ضلع ${directionLabel} نامعتبر است.`,
        path: ['visit_boundary_sides', index, 'boundary_type'],
      });
    }

    if (!side.adjacent_plaque) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `پلاک مجاور ضلع ${directionLabel} الزامی است.`,
        path: ['visit_boundary_sides', index, 'adjacent_plaque'],
      });
    }

    if (!side.adjacent_title) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `عنوان مجاور ضلع ${directionLabel} الزامی است.`,
        path: ['visit_boundary_sides', index, 'adjacent_title'],
      });
    }
  });
}

function refineExpertVisitBuildingPropertyDetails(data, ctx) {
  if (data.registry_inquiry_cannot_issue === 'yes') {
    return;
  }
  if (String(data.visit_property_type ?? '').trim() !== 'building') {
    return;
  }

  if (!String(data.visit_building_age ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'قدمت ساختمان الزامی است.',
      path: ['visit_building_age'],
    });
  }

  if (!String(data.visit_building_description ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'توصیف ساختمان الزامی است.',
      path: ['visit_building_description'],
    });
  }

  const sharedUtilities = data.visit_building_shared_electricity_gas;
  if (sharedUtilities !== 'yes' && sharedUtilities !== 'no') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'پاسخ به سؤال اشتراک برق/گاز الزامی است.',
      path: ['visit_building_shared_electricity_gas'],
    });
  }
}

function refineExpertVisitAgriculturalLandPropertyDetails(data, ctx) {
  if (data.registry_inquiry_cannot_issue === 'yes') {
    return;
  }
  if (String(data.visit_property_type ?? '').trim() !== 'agricultural_land') {
    return;
  }

  const underCultivation = data.visit_agricultural_land_under_cultivation;
  if (underCultivation !== 'yes' && underCultivation !== 'no') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'پاسخ به سؤال «زیر کشت» الزامی است.',
      path: ['visit_agricultural_land_under_cultivation'],
    });
  }

  if (!String(data.visit_agricultural_land_cultivation_type ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نوع کشت الزامی است.',
      path: ['visit_agricultural_land_cultivation_type'],
    });
  }

  const fence = data.visit_agricultural_land_fence;
  if (fence !== 'yes' && fence !== 'no') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'پاسخ به سؤال حصار الزامی است.',
      path: ['visit_agricultural_land_fence'],
    });
  }

  if (!String(data.visit_agricultural_land_description ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'توضیحات زمین مزروعی الزامی است.',
      path: ['visit_agricultural_land_description'],
    });
  }
}

function refineExpertVisitGardenPropertyDetails(data, ctx) {
  if (data.registry_inquiry_cannot_issue === 'yes') {
    return;
  }
  if (String(data.visit_property_type ?? '').trim() !== 'garden') {
    return;
  }

  if (parsePositiveInt(data.visit_garden_tree_count) === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'تعداد درخت الزامی است.',
      path: ['visit_garden_tree_count'],
    });
  }

  if (!String(data.visit_garden_tree_type ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نوع درخت الزامی است.',
      path: ['visit_garden_tree_type'],
    });
  }

  if (!String(data.visit_garden_age ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'قدمت باغ الزامی است.',
      path: ['visit_garden_age'],
    });
  }

  if (!String(data.visit_garden_description ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'توضیحات باغ الزامی است.',
      path: ['visit_garden_description'],
    });
  }
}

function refineExpertVisitEasementRights(data, ctx) {
  if (data.registry_inquiry_cannot_issue === 'yes') {
    return;
  }
  if (data.visit_neighbor_easement_rights !== 'yes') {
    return;
  }

  const easements = normalizeVisitEasementRights(data.visit_easement_rights);
  if (easements.length < MIN_VISIT_EASEMENT_COUNT) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `حداقل ${MIN_VISIT_EASEMENT_COUNT} مورد حق ارتفاق الزامی است.`,
      path: ['visit_easement_rights'],
    });
    return;
  }

  easements.forEach((easement, index) => {
    const label = `حق ارتفاق ${index + 1}`;
    const easementType = String(easement.easement_type ?? '').trim();

    if (!easementType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `نوع ${label} الزامی است.`,
        path: ['visit_easement_rights', index, 'easement_type'],
      });
    } else if (!VISIT_EASEMENT_TYPES.some((option) => option.value === easementType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `نوع ${label} نامعتبر است.`,
        path: ['visit_easement_rights', index, 'easement_type'],
      });
    }

    if (!easement.location) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `موقعیت ${label} الزامی است.`,
        path: ['visit_easement_rights', index, 'location'],
      });
    }

    if (!easement.description) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `شرح ${label} الزامی است.`,
        path: ['visit_easement_rights', index, 'description'],
      });
    }

    if (!hasUploadedFileValue(easement.document_image)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `مستند ${label} الزامی است.`,
        path: ['visit_easement_rights', index, 'document_image'],
      });
    }
  });
}

function refineExpertVisitWitnesses(data, ctx) {
  if (data.registry_inquiry_cannot_issue === 'yes') {
    return;
  }

  const witnesses = normalizeVisitWitnesses(data.visit_witnesses);
  witnesses.forEach((witness, index) => {
    const label = `شاهد ${index + 1}`;

    if (!witness.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `نام ${label} الزامی است.`,
        path: ['visit_witnesses', index, 'name'],
      });
    }

    const nationalId = witness.national_id;
    if (!nationalId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `کد ملی ${label} الزامی است.`,
        path: ['visit_witnesses', index, 'national_id'],
      });
    } else {
      const nationalCheck = validateApplicantNationalId(nationalId);
      if (!nationalCheck.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: nationalCheck.message ?? `کد ملی ${label} نامعتبر است.`,
          path: ['visit_witnesses', index, 'national_id'],
        });
      }
    }

    const mobile = witness.mobile;
    if (!mobile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `شماره موبایل ${label} الزامی است.`,
        path: ['visit_witnesses', index, 'mobile'],
      });
    } else {
      const mobileCheck = validateApplicantMobile(nationalId, mobile);
      if (!mobileCheck.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: mobileCheck.message ?? `شماره موبایل ${label} نامعتبر است.`,
          path: ['visit_witnesses', index, 'mobile'],
        });
      }
    }

    if (!hasUploadedFileValue(witness.national_card_image)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `تصویر کارت ملی ${label} الزامی است.`,
        path: ['visit_witnesses', index, 'national_card_image'],
      });
    }

    if (!hasUploadedFileValue(witness.certificate_image)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `تصویر گواهی ${label} الزامی است.`,
        path: ['visit_witnesses', index, 'certificate_image'],
      });
    }
  });
}

function refineExpertVisitLandOwnerContract(data, ctx) {
  if (data.registry_inquiry_cannot_issue === 'yes') {
    return;
  }
  if (!isService4ImprovementClaim(data.claim_property_ownership_type)) {
    return;
  }

  const contractType = String(data.visit_land_owner_contract_type ?? '').trim();
  if (!contractType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نوع رابطه قراردادی با مالک عرصه الزامی است.',
      path: ['visit_land_owner_contract_type'],
    });
  } else if (!VISIT_LAND_OWNER_CONTRACT_TYPES.some((option) => option.value === contractType)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نوع رابطه قراردادی با مالک عرصه نامعتبر است.',
      path: ['visit_land_owner_contract_type'],
    });
  }

  if (!String(data.visit_land_owner_contract_date ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'تاریخ قرارداد/رضایت با مالک عرصه الزامی است.',
      path: ['visit_land_owner_contract_date'],
    });
  }

  if (!String(data.visit_land_owner_name ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نام مالک عرصه الزامی است.',
      path: ['visit_land_owner_name'],
    });
  }

  const landOwnerNationalId = String(data.visit_land_owner_national_id ?? '').trim();
  if (!landOwnerNationalId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'کد ملی مالک عرصه الزامی است.',
      path: ['visit_land_owner_national_id'],
    });
  } else {
    const nationalCheck = validateApplicantNationalId(landOwnerNationalId);
    if (!nationalCheck.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: nationalCheck.message ?? 'کد ملی مالک عرصه نامعتبر است.',
        path: ['visit_land_owner_national_id'],
      });
    }
  }

  if (!hasUploadedFileValue(data.visit_land_owner_contract_document_image)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'تصویر مستند رابطه قراردادی با مالک عرصه الزامی است.',
      path: ['visit_land_owner_contract_document_image'],
    });
  }
}

function refineExpertVisitOtherDocumentsInquiries(data, ctx) {
  if (data.registry_inquiry_cannot_issue === 'yes') {
    return;
  }

  const rawItems = Array.isArray(data.visit_other_documents_inquiries)
    ? data.visit_other_documents_inquiries
    : [];

  rawItems.forEach((rawItem, index) => {
    const item = {
      entry_type: String(rawItem?.entry_type ?? '').trim(),
      title: String(rawItem?.title ?? '').trim(),
      reference_date: String(rawItem?.reference_date ?? '').trim(),
      description: String(rawItem?.description ?? '').trim(),
      attachment_image: rawItem?.attachment_image ?? null,
    };
    if (isVisitOtherDocumentInquiryItemEmpty(item)) {
      return;
    }

    const label = `مورد ${index + 1}`;
    const entryType = item.entry_type;

    if (!entryType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `نوع ${label} (مستند/استعلام) الزامی است.`,
        path: ['visit_other_documents_inquiries', index, 'entry_type'],
      });
    } else if (!VISIT_OTHER_ENTRY_TYPES.some((option) => option.value === entryType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `نوع ${label} نامعتبر است.`,
        path: ['visit_other_documents_inquiries', index, 'entry_type'],
      });
    }

    if (!item.title) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `عنوان ${label} الزامی است.`,
        path: ['visit_other_documents_inquiries', index, 'title'],
      });
    }

    if (!item.reference_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `تاریخ ${label} الزامی است.`,
        path: ['visit_other_documents_inquiries', index, 'reference_date'],
      });
    }

    if (!item.description) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `شرح ${label} الزامی است.`,
        path: ['visit_other_documents_inquiries', index, 'description'],
      });
    }

    if (!hasUploadedFileValue(item.attachment_image)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `پیوست ${label} الزامی است.`,
        path: ['visit_other_documents_inquiries', index, 'attachment_image'],
      });
    }
  });
}

function refineExpertVisitWhenCanIssue(data, ctx) {
  if (data.registry_inquiry_cannot_issue === 'yes') {
    return;
  }

  const value = String(data.visit_expert_national_id ?? '').trim();
  if (!value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'کد ملی کارشناس امور ثبتی و حقوقی الزامی است.',
      path: ['visit_expert_national_id'],
    });
    return;
  }
  if (!/^\d{10}$/.test(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'کد ملی کارشناس باید ۱۰ رقم باشد.',
      path: ['visit_expert_national_id'],
    });
    return;
  }
  const check = validateArticle4ExpertNationalId(value);
  if (!check.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: check.message ?? 'کد ملی کارشناس معتبر نیست.',
      path: ['visit_expert_national_id'],
    });
  }

  if (!String(data.visit_date ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'تاریخ بازدید الزامی است.',
      path: ['visit_date'],
    });
  }

  const presence = data.visit_expert_personal_presence;
  if (presence !== 'yes' && presence !== 'no') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'پاسخ به سؤال حضور شخصی کارشناس در محل بازدید الزامی است.',
      path: ['visit_expert_personal_presence'],
    });
  } else if (presence === 'no') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'کارشناس باید حضوراً در محل بازدید حاضر بوده باشد.',
      path: ['visit_expert_personal_presence'],
    });
  }

  const possessionMatch = data.visit_possession_map_match_status;
  if (possessionMatch !== 'yes' && possessionMatch !== 'partial' && possessionMatch !== 'no') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'وضعیت تطابق تصرف با نقشه الزامی است.',
      path: ['visit_possession_map_match_status'],
    });
  } else if (possessionMatch === 'partial' || possessionMatch === 'no') {
    const correctiveCode = String(data.visit_corrective_map_tracking_code ?? '').trim();
    if (!correctiveCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'کد رهگیری نقشه اصلاحی الزامی است.',
        path: ['visit_corrective_map_tracking_code'],
      });
    } else {
      const applicantNationalId = String(data.applicant_national_id ?? '').trim();
      if (applicantNationalId) {
        const manaCheck = validateSubsidiaryMapManaAccess(applicantNationalId, correctiveCode);
        if (!manaCheck.valid) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: manaCheck.message ?? 'کد رهگیری نقشه اصلاحی نامعتبر است.',
            path: ['visit_corrective_map_tracking_code'],
          });
        }
      }
    }
  }

  const propertyType = String(data.visit_property_type ?? '').trim();
  if (!propertyType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نوع ملک الزامی است.',
      path: ['visit_property_type'],
    });
  } else if (!VISIT_PROPERTY_TYPES.includes(propertyType)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نوع ملک انتخاب‌شده نامعتبر است.',
      path: ['visit_property_type'],
    });
  }

  const propertyUsage = String(data.visit_property_usage ?? '').trim();
  if (!propertyUsage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'کاربری ملک الزامی است.',
      path: ['visit_property_usage'],
    });
  } else if (!VISIT_PROPERTY_USAGES.includes(propertyUsage)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'کاربری ملک انتخاب‌شده نامعتبر است.',
      path: ['visit_property_usage'],
    });
  }

  const neighborEasement = data.visit_neighbor_easement_rights;
  if (neighborEasement !== 'yes' && neighborEasement !== 'no') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'پاسخ به سؤال حقوق ارتفاقی مجاورین الزامی است.',
      path: ['visit_neighbor_easement_rights'],
    });
  }

  refineExpertVisitBuildingPropertyDetails(data, ctx);
  refineExpertVisitAgriculturalLandPropertyDetails(data, ctx);
  refineExpertVisitGardenPropertyDetails(data, ctx);
  refineExpertVisitEasementRights(data, ctx);

  refineExpertVisitRegistryInfo(data, ctx);
  refineExpertVisitBoundarySides(data, ctx);
  refineExpertVisitWitnesses(data, ctx);
  refineExpertVisitOwnershipTransfer(data, ctx);
  refineExpertVisitPossessionVerification(data, ctx);
  refineExpertVisitLandOwnerContract(data, ctx);
  refineExpertVisitRegionalValue(data, ctx);
  refineExpertVisitOtherDocumentsInquiries(data, ctx);
}

export const expertVisitAssignmentSchema = z
  .object({
    registry_inquiry_cannot_issue: yesNoRequired,
    visit_expert_national_id: z.string().optional(),
    visit_date: z.string().optional(),
    visit_expert_personal_presence: z.string().optional(),
    visit_possession_map_match_status: z.string().optional(),
    visit_corrective_map_tracking_code: z.string().optional(),
    applicant_national_id: z.string().optional(),
    claim_property_ownership_type: z.string().optional(),
    visit_property_type: z.string().optional(),
    visit_property_usage: z.string().optional(),
    visit_neighbor_easement_rights: z.string().optional(),
    visit_building_age: z.string().optional(),
    visit_building_description: z.string().optional(),
    visit_building_shared_electricity_gas: z.string().optional(),
    visit_agricultural_land_under_cultivation: z.string().optional(),
    visit_agricultural_land_cultivation_type: z.string().optional(),
    visit_agricultural_land_fence: z.string().optional(),
    visit_agricultural_land_description: z.string().optional(),
    visit_garden_tree_count: z.string().optional(),
    visit_garden_tree_type: z.string().optional(),
    visit_garden_age: z.string().optional(),
    visit_garden_description: z.string().optional(),
    visit_easement_rights: z
      .array(
        z.object({
          easement_type: z.string().optional(),
          location: z.string().optional(),
          description: z.string().optional(),
          document_image: z.any().optional().nullable(),
        }),
      )
      .optional(),
    visit_main_plaque_number: z.string().optional(),
    visit_sub_plaque_number: z.string().optional(),
    visit_registration_section: z.string().optional(),
    visit_joint_share_total: z.string().optional(),
    visit_joint_share_partial: z.string().optional(),
    visit_possession_to_share_total: z.string().optional(),
    visit_possession_to_share_partial: z.string().optional(),
    visit_ownership_transfer_type: z.string().optional(),
    visit_ownership_document_type: z.string().optional(),
    visit_ownership_document_date: z.string().optional(),
    visit_ownership_document_image: z.any().optional().nullable(),
    visit_last_official_owner: z.string().optional(),
    visit_possession_verification_status: z.string().optional(),
    visit_possession_location_image: z.any().optional().nullable(),
    visit_possession_verification_description: z.string().optional(),
    visit_land_owner_contract_type: z.string().optional(),
    visit_land_owner_contract_date: z.string().optional(),
    visit_land_owner_name: z.string().optional(),
    visit_land_owner_national_id: z.string().optional(),
    visit_land_owner_contract_document_image: z.any().optional().nullable(),
    regional_value: z.string().optional(),
    regional_value_determined: z.string().optional(),
    visit_expert_regional_value: z.string().optional(),
    visit_boundary_sides: z
      .array(
        z.object({
          direction: z.string().optional(),
          boundary_type: z.string().optional(),
          adjacent_plaque: z.string().optional(),
          adjacent_title: z.string().optional(),
        }),
      )
      .optional(),
    visit_witnesses: z
      .array(
        z.object({
          name: z.string().optional(),
          national_id: z.string().optional(),
          mobile: z.string().optional(),
          national_card_image: z.any().optional().nullable(),
          certificate_image: z.any().optional().nullable(),
        }),
      )
      .optional(),
    visit_other_documents_inquiries: z
      .array(
        z.object({
          entry_type: z.string().optional(),
          title: z.string().optional(),
          reference_date: z.string().optional(),
          description: z.string().optional(),
          attachment_image: z.any().optional().nullable(),
        }),
      )
      .optional(),
  })
  .superRefine(refineExpertVisitWhenCanIssue);

export const expertVisitSchema = expertVisitAssignmentSchema;

export const expertVisitDefaultValues = {
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
};
