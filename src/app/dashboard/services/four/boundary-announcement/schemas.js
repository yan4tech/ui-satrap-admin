import { z } from 'zod';

export const SERVICE4_BOUNDARY_ANNOUNCEMENT_VILLAGE_FIELD_SPECS = [
  {
    key: 'boundary_announcement_village_council_minutes_date',
    label: 'تاریخ صورتجلسه شورای روستا (آگهی تحدید حدود)',
    isImage: false,
  },
  {
    key: 'boundary_announcement_village_council_minutes_image',
    label: 'صورتجلسه شورای روستا — آگهی تحدید حدود (پیوست)',
    isImage: true,
  },
];

export const SERVICE4_BOUNDARY_ANNOUNCEMENT_FIELD_SPECS = [
  {
    key: 'boundary_announcement_round1_wide_date',
    label: 'تاریخ انتشار نوبت اول — روزنامه کثیرالانتشار (آگهی تحدید حدود)',
    isImage: false,
  },
  {
    key: 'boundary_announcement_round1_wide_name',
    label: 'نام روزنامه کثیرالانتشار — نوبت اول (آگهی تحدید حدود)',
    isImage: false,
  },
  {
    key: 'boundary_announcement_round1_wide_image',
    label: 'تصویر آگهی روزنامه کثیرالانتشار — نوبت اول (آگهی تحدید حدود)',
    isImage: true,
  },
  {
    key: 'boundary_announcement_round1_local_date',
    label: 'تاریخ انتشار نوبت اول — روزنامه محلی (آگهی تحدید حدود)',
    isImage: false,
  },
  {
    key: 'boundary_announcement_round1_local_name',
    label: 'نام روزنامه محلی — نوبت اول (آگهی تحدید حدود)',
    isImage: false,
  },
  {
    key: 'boundary_announcement_round1_local_image',
    label: 'تصویر آگهی روزنامه محلی — نوبت اول (آگهی تحدید حدود)',
    isImage: true,
  },
  {
    key: 'boundary_announcement_round2_wide_date',
    label: 'تاریخ انتشار نوبت دوم — روزنامه کثیرالانتشار (آگهی تحدید حدود)',
    isImage: false,
  },
  {
    key: 'boundary_announcement_round2_wide_name',
    label: 'نام روزنامه کثیرالانتشار — نوبت دوم (آگهی تحدید حدود)',
    isImage: false,
  },
  {
    key: 'boundary_announcement_round2_wide_image',
    label: 'تصویر آگهی روزنامه کثیرالانتشار — نوبت دوم (آگهی تحدید حدود)',
    isImage: true,
  },
  {
    key: 'boundary_announcement_round2_local_date',
    label: 'تاریخ انتشار نوبت دوم — روزنامه محلی (آگهی تحدید حدود)',
    isImage: false,
  },
  {
    key: 'boundary_announcement_round2_local_name',
    label: 'نام روزنامه محلی — نوبت دوم (آگهی تحدید حدود)',
    isImage: false,
  },
  {
    key: 'boundary_announcement_round2_local_image',
    label: 'تصویر آگهی روزنامه محلی — نوبت دوم (آگهی تحدید حدود)',
    isImage: true,
  },
];

export const SERVICE4_BOUNDARY_ANNOUNCEMENT_FIELD_KEYS = SERVICE4_BOUNDARY_ANNOUNCEMENT_FIELD_SPECS.map(
  (item) => item.key,
);

export const SERVICE4_BOUNDARY_ANNOUNCEMENT_VILLAGE_FIELD_KEYS =
  SERVICE4_BOUNDARY_ANNOUNCEMENT_VILLAGE_FIELD_SPECS.map((item) => item.key);

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

function refineService4BoundaryAnnouncement(data, ctx, isVillageProperty = false) {
  for (const spec of SERVICE4_BOUNDARY_ANNOUNCEMENT_FIELD_SPECS) {
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
  for (const spec of SERVICE4_BOUNDARY_ANNOUNCEMENT_VILLAGE_FIELD_SPECS) {
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

const boundaryAnnouncementFieldsShape = [
  ...SERVICE4_BOUNDARY_ANNOUNCEMENT_FIELD_KEYS,
  ...SERVICE4_BOUNDARY_ANNOUNCEMENT_VILLAGE_FIELD_KEYS,
].reduce((acc, key) => {
  acc[key] = z.any().optional().nullable();
  return acc;
}, {});

export function createService4BoundaryAnnouncementSchema(isVillageProperty = false) {
  return z.object(boundaryAnnouncementFieldsShape).superRefine((data, ctx) => {
    refineService4BoundaryAnnouncement(data, ctx, isVillageProperty);
  });
}

export const service4BoundaryAnnouncementSchema = createService4BoundaryAnnouncementSchema(false);

export function createDefaultBoundaryAnnouncementValues() {
  return [...SERVICE4_BOUNDARY_ANNOUNCEMENT_FIELD_KEYS, ...SERVICE4_BOUNDARY_ANNOUNCEMENT_VILLAGE_FIELD_KEYS].reduce(
    (acc, key) => {
      acc[key] = key.endsWith('_image') ? null : '';
      return acc;
    },
    {},
  );
}

export function normalizeBoundaryAnnouncementPayload(payload = {}) {
  const source = payload && typeof payload === 'object' ? payload : {};
  const nested =
    source.boundary_announcement && typeof source.boundary_announcement === 'object'
      ? source.boundary_announcement
      : source;
  return {
    ...createDefaultBoundaryAnnouncementValues(),
    ...nested,
  };
}
