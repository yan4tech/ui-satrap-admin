import { z } from 'zod';

export const SERVICE4_ANNOUNCEMENT_VILLAGE_FIELD_SPECS = [
  { key: 'announcement_village_council_minutes_date', label: 'تاریخ صورتجلسه شورای روستا', isImage: false },
  { key: 'announcement_village_council_minutes_image', label: 'صورتجلسه شورای روستا (پیوست)', isImage: true },
];

export const SERVICE4_ANNOUNCEMENT_FIELD_SPECS = [
  { key: 'announcement_round1_wide_date', label: 'تاریخ انتشار نوبت اول — روزنامه کثیرالانتشار', isImage: false },
  { key: 'announcement_round1_wide_name', label: 'نام روزنامه کثیرالانتشار — نوبت اول', isImage: false },
  { key: 'announcement_round1_wide_image', label: 'تصویر آگهی روزنامه کثیرالانتشار — نوبت اول', isImage: true },
  { key: 'announcement_round1_local_date', label: 'تاریخ انتشار نوبت اول — روزنامه محلی', isImage: false },
  { key: 'announcement_round1_local_name', label: 'نام روزنامه محلی — نوبت اول', isImage: false },
  { key: 'announcement_round1_local_image', label: 'تصویر آگهی روزنامه محلی — نوبت اول', isImage: true },
  { key: 'announcement_round2_wide_date', label: 'تاریخ انتشار نوبت دوم — روزنامه کثیرالانتشار', isImage: false },
  { key: 'announcement_round2_wide_name', label: 'نام روزنامه کثیرالانتشار — نوبت دوم', isImage: false },
  { key: 'announcement_round2_wide_image', label: 'تصویر آگهی روزنامه کثیرالانتشار — نوبت دوم', isImage: true },
  { key: 'announcement_round2_local_date', label: 'تاریخ انتشار نوبت دوم — روزنامه محلی', isImage: false },
  { key: 'announcement_round2_local_name', label: 'نام روزنامه محلی — نوبت دوم', isImage: false },
  { key: 'announcement_round2_local_image', label: 'تصویر آگهی روزنامه محلی — نوبت دوم', isImage: true },
];

export const SERVICE4_ANNOUNCEMENT_FIELD_KEYS = SERVICE4_ANNOUNCEMENT_FIELD_SPECS.map((item) => item.key);

export const SERVICE4_ANNOUNCEMENT_VILLAGE_FIELD_KEYS = SERVICE4_ANNOUNCEMENT_VILLAGE_FIELD_SPECS.map(
  (item) => item.key,
);

function isTruthyYes(value) {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase();
  return raw === 'yes' || raw === 'true' || raw === '1';
}

export function resolveIsVillagePropertyFromContext(context = {}) {
  if (isTruthyYes(context.is_village_property)) return true;
  const claimMap =
    context.claim_map_data && typeof context.claim_map_data === 'object' ? context.claim_map_data : null;
  if (claimMap && isTruthyYes(claimMap.is_village_property)) return true;
  const registryResponse =
    context.registry_response && typeof context.registry_response === 'object'
      ? context.registry_response
      : null;
  if (registryResponse && isTruthyYes(registryResponse.is_village_property)) return true;
  return false;
}

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

function refineService4Announcement(data, ctx, isVillageProperty = false) {
  for (const spec of SERVICE4_ANNOUNCEMENT_FIELD_SPECS) {
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
  if (!isVillageProperty) return;
  for (const spec of SERVICE4_ANNOUNCEMENT_VILLAGE_FIELD_SPECS) {
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
}

const announcementFieldsShape = [
  ...SERVICE4_ANNOUNCEMENT_FIELD_KEYS,
  ...SERVICE4_ANNOUNCEMENT_VILLAGE_FIELD_KEYS,
].reduce((acc, key) => {
  acc[key] = z.any().optional().nullable();
  return acc;
}, {});

export function createService4AnnouncementSchema(isVillageProperty = false) {
  return z.object(announcementFieldsShape).superRefine((data, ctx) => {
    refineService4Announcement(data, ctx, isVillageProperty);
  });
}

export const service4AnnouncementSchema = createService4AnnouncementSchema(false);

export function createDefaultAnnouncementValues() {
  return [...SERVICE4_ANNOUNCEMENT_FIELD_KEYS, ...SERVICE4_ANNOUNCEMENT_VILLAGE_FIELD_KEYS].reduce((acc, key) => {
    acc[key] = key.endsWith('_image') ? null : '';
    return acc;
  }, {});
}
