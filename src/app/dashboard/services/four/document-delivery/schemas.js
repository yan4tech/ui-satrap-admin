import { z } from 'zod';

import { validateApplicantMobile } from '../page1/mobile-validation';
import { validateApplicantNationalId } from '../page1/national-id-validation';

export const SERVICE4_DOCUMENT_DELIVERY_FIELD_SPECS = [
  { key: 'document_delivery_recipient_name', label: 'نام گیرنده سند' },
  { key: 'document_delivery_recipient_national_id', label: 'کد ملی گیرنده سند' },
  { key: 'document_delivery_recipient_mobile', label: 'شماره موبایل گیرنده سند' },
  { key: 'document_delivery_province', label: 'استان' },
  { key: 'document_delivery_registration_unit', label: 'واحد ثبتی' },
  { key: 'document_delivery_postal_code', label: 'کد پستی' },
  { key: 'document_delivery_address', label: 'نشانی پستی کامل' },
];

export const SERVICE4_DOCUMENT_DELIVERY_FIELD_KEYS = SERVICE4_DOCUMENT_DELIVERY_FIELD_SPECS.map(
  (item) => item.key,
);

function refineService4DocumentDelivery(data, ctx) {
  for (const spec of SERVICE4_DOCUMENT_DELIVERY_FIELD_SPECS) {
    if (!String(data[spec.key] ?? '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${spec.label} الزامی است.`,
        path: [spec.key],
      });
    }
  }

  const nationalId = String(data.document_delivery_recipient_national_id ?? '').trim();
  if (nationalId) {
    const nationalCheck = validateApplicantNationalId(nationalId);
    if (!nationalCheck.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: nationalCheck.message ?? 'کد ملی گیرنده نامعتبر است.',
        path: ['document_delivery_recipient_national_id'],
      });
    }
  }

  const mobile = String(data.document_delivery_recipient_mobile ?? '').trim();
  if (mobile) {
    const mobileCheck = validateApplicantMobile(nationalId, mobile);
    if (!mobileCheck.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: mobileCheck.message ?? 'شماره موبایل گیرنده نامعتبر است.',
        path: ['document_delivery_recipient_mobile'],
      });
    }
  }

  const postalCode = String(data.document_delivery_postal_code ?? '').trim();
  if (!postalCode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'کد پستی الزامی است.',
      path: ['document_delivery_postal_code'],
    });
  } else if (!/^\d{10}$/.test(postalCode)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'کد پستی باید ۱۰ رقم باشد.',
      path: ['document_delivery_postal_code'],
    });
  }

  if (!String(data.document_delivery_address ?? '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'نشانی پستی کامل الزامی است.',
      path: ['document_delivery_address'],
    });
  }

  if (data.document_delivery_province == null || data.document_delivery_province === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'استان الزامی است.',
      path: ['document_delivery_province'],
    });
  }

  if (
    data.document_delivery_registration_unit == null ||
    data.document_delivery_registration_unit === ''
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'واحد ثبتی الزامی است.',
      path: ['document_delivery_registration_unit'],
    });
  }
}

const documentDeliveryFieldsShape = SERVICE4_DOCUMENT_DELIVERY_FIELD_KEYS.reduce((acc, key) => {
  if (key === 'document_delivery_province' || key === 'document_delivery_registration_unit') {
    acc[key] = z.union([z.string(), z.number()]).optional();
  } else {
    acc[key] = z.string().optional();
  }
  return acc;
}, {});

export const service4DocumentDeliverySchema = z
  .object(documentDeliveryFieldsShape)
  .superRefine((data, ctx) => {
    refineService4DocumentDelivery(data, ctx);
  });

export function createDefaultDocumentDeliveryValues() {
  return SERVICE4_DOCUMENT_DELIVERY_FIELD_KEYS.reduce((acc, key) => {
    acc[key] = '';
    return acc;
  }, {});
}

export function normalizeDocumentDeliveryPayload(payload = {}) {
  const source = payload && typeof payload === 'object' ? payload : {};
  const nested =
    source.document_delivery && typeof source.document_delivery === 'object'
      ? source.document_delivery
      : source.documentDelivery && typeof source.documentDelivery === 'object'
        ? source.documentDelivery
        : source;
  return {
    ...createDefaultDocumentDeliveryValues(),
    ...nested,
  };
}
