import { z } from 'zod';

export const SERVICE4_LAND_OWNER_FEE_PAYMENT_FIELD_SPECS = [
  { key: 'land_owner_fee_payment_tracking_code', label: 'کد رهگیری پرداخت' },
  { key: 'land_owner_fee_payment_bank', label: 'بانک واریز' },
  { key: 'land_owner_fee_payment_deposit_at', label: 'تاریخ و زمان واریز' },
];

export const SERVICE4_LAND_OWNER_FEE_PAYMENT_FIELD_KEYS = SERVICE4_LAND_OWNER_FEE_PAYMENT_FIELD_SPECS.map(
  (item) => item.key,
);

function parseLandOwnerFeeAmount(value) {
  const raw = String(value ?? '').trim().replace(/,/g, '');
  if (!raw) return 0;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 0;
}

function refineService4LandOwnerFeePayment(data, ctx, landOwnerFeeAmount = 0) {
  if (parseLandOwnerFeeAmount(landOwnerFeeAmount) <= 0) {
    return;
  }

  for (const spec of SERVICE4_LAND_OWNER_FEE_PAYMENT_FIELD_SPECS) {
    if (!String(data[spec.key] ?? '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${spec.label} الزامی است.`,
        path: [spec.key],
      });
    }
  }

  const depositAt = String(data.land_owner_fee_payment_deposit_at ?? '').trim();
  if (depositAt && !depositAt.includes('/') && Number.isNaN(Date.parse(depositAt))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'تاریخ و زمان واریز نامعتبر است.',
      path: ['land_owner_fee_payment_deposit_at'],
    });
  }
}

const landOwnerFeePaymentFieldsShape = SERVICE4_LAND_OWNER_FEE_PAYMENT_FIELD_KEYS.reduce((acc, key) => {
  acc[key] = z.string().optional();
  return acc;
}, {});

export function createService4LandOwnerFeePaymentSchema(landOwnerFeeAmount = 0) {
  return z
    .object(landOwnerFeePaymentFieldsShape)
    .superRefine((data, ctx) => {
      refineService4LandOwnerFeePayment(data, ctx, landOwnerFeeAmount);
    });
}

export function createDefaultLandOwnerFeePaymentValues() {
  return SERVICE4_LAND_OWNER_FEE_PAYMENT_FIELD_KEYS.reduce((acc, key) => {
    acc[key] = '';
    return acc;
  }, {});
}

export function normalizeLandOwnerFeePaymentPayload(payload = {}) {
  const source = payload && typeof payload === 'object' ? payload : {};
  const nested =
    source.land_owner_fee_payment && typeof source.land_owner_fee_payment === 'object'
      ? source.land_owner_fee_payment
      : source.landOwnerFeePayment && typeof source.landOwnerFeePayment === 'object'
        ? source.landOwnerFeePayment
        : source;
  return {
    ...createDefaultLandOwnerFeePaymentValues(),
    ...nested,
  };
}

export function parseLandOwnerFeeAmountFromContext(value) {
  return parseLandOwnerFeeAmount(value);
}
