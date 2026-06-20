'use client';

import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Divider,
  IconButton,
  NoSsr,
  Popover,
  Stack,
  Typography,
} from '@mui/material';

import { Field } from 'src/components/hook-form';

const ANNOUNCEMENT_SECTIONS = [
  {
    title: 'نوبت اول انتشار آگهی',
    fields: [
      { name: 'announcement.announcement_round1_wide_date', label: 'تاریخ انتشار — روزنامه کثیرالانتشار', type: 'date', required: true },
      { name: 'announcement.announcement_round1_wide_name', label: 'نام روزنامه کثیرالانتشار', type: 'text', required: true },
      {
        name: 'announcement.announcement_round1_wide_image',
        label: 'تصویر آگهی روزنامه کثیرالانتشار',
        type: 'file',
        required: true,
        helperText: 'تصویر یا فایل PDF آگهی منتشرشده را بارگذاری کنید',
      },
      { name: 'announcement.announcement_round1_local_date', label: 'تاریخ انتشار — روزنامه محلی', type: 'date', required: true },
      { name: 'announcement.announcement_round1_local_name', label: 'نام روزنامه محلی', type: 'text', required: true },
      {
        name: 'announcement.announcement_round1_local_image',
        label: 'تصویر آگهی روزنامه محلی',
        type: 'file',
        required: true,
        helperText: 'تصویر یا فایل PDF آگهی منتشرشده را بارگذاری کنید',
      },
    ],
  },
  {
    title: 'نوبت دوم انتشار آگهی',
    fields: [
      { name: 'announcement.announcement_round2_wide_date', label: 'تاریخ انتشار — روزنامه کثیرالانتشار', type: 'date', required: true },
      { name: 'announcement.announcement_round2_wide_name', label: 'نام روزنامه کثیرالانتشار', type: 'text', required: true },
      {
        name: 'announcement.announcement_round2_wide_image',
        label: 'تصویر آگهی روزنامه کثیرالانتشار',
        type: 'file',
        required: true,
        helperText: 'تصویر یا فایل PDF آگهی منتشرشده را بارگذاری کنید',
      },
      { name: 'announcement.announcement_round2_local_date', label: 'تاریخ انتشار — روزنامه محلی', type: 'date', required: true },
      { name: 'announcement.announcement_round2_local_name', label: 'نام روزنامه محلی', type: 'text', required: true },
      {
        name: 'announcement.announcement_round2_local_image',
        label: 'تصویر آگهی روزنامه محلی',
        type: 'file',
        required: true,
        helperText: 'تصویر یا فایل PDF آگهی منتشرشده را بارگذاری کنید',
      },
    ],
  },
];

const VILLAGE_ANNOUNCEMENT_SECTION = {
  title: 'تبصره روستا — صورتجلسه شورای روستا',
  fields: [
    {
      name: 'announcement.announcement_village_council_minutes_date',
      label: 'تاریخ صورتجلسه شورای روستا',
      type: 'date',
      required: true,
    },
    {
      name: 'announcement.announcement_village_council_minutes_image',
      label: 'صورتجلسه شورای روستا (پیوست)',
      type: 'file',
      required: true,
      helperText: 'تصویر یا فایل PDF صورتجلسه شورای روستا را بارگذاری کنید',
    },
  ],
};

function InfoHint({ text }) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  return (
    <>
      <IconButton size="small" color="info" onClick={(event) => setAnchorEl(event.currentTarget)} sx={{ mt: 1, p: 0.5 }}>
        <Box
          sx={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: '1px solid',
            borderColor: 'info.main',
            color: 'info.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          i
        </Box>
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Typography sx={{ p: 1.5, maxWidth: 320 }} variant="body2">
          {text}
        </Typography>
      </Popover>
    </>
  );
}

function UploadBox({ name, label, helperText, accept = 'image/*,.pdf' }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {label}
          </Typography>

          <Box
            component="label"
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: 72,
              px: 2,
              border: '1px solid',
              borderColor: error ? 'error.main' : 'text.primary',
              cursor: 'pointer',
              backgroundColor: 'background.paper',
              overflow: 'hidden',
            }}
          >
            <input
              type="file"
              accept={accept}
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                field.onChange(file);
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                width: '70%',
                borderTop: '1px solid',
                borderColor: 'text.secondary',
                transform: 'rotate(14deg)',
                pointerEvents: 'none',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                width: '70%',
                borderTop: '1px solid',
                borderColor: 'text.secondary',
                transform: 'rotate(-14deg)',
                pointerEvents: 'none',
              }}
            />

            <Typography
              variant="body2"
              sx={{
                zIndex: 1,
                backgroundColor: 'background.paper',
                px: 1,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {field.value?.name ||
                (typeof field.value === 'string' && field.value.trim()) ||
                helperText}
            </Typography>
          </Box>

          {error?.message ? (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {error.message}
            </Typography>
          ) : null}
        </Box>
      )}
    />
  );
}

function AnnouncementField({ field }) {
  if (field.type === 'file') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Box sx={{ width: '100%' }}>
          <UploadBox name={field.name} label={field.label} helperText={field.helperText} />
        </Box>
        {field.required ? <InfoHint text="اجباری" /> : null}
      </Box>
    );
  }

  if (field.type === 'date') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <NoSsr>
          <Field.DatePicker name={field.name} label={field.label} slotProps={{ textField: { fullWidth: true } }} />
        </NoSsr>
        {field.required ? <InfoHint text="اجباری" /> : null}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
      <Field.Text name={field.name} label={field.label} />
      {field.required ? <InfoHint text="اجباری" /> : null}
    </Box>
  );
}

export default function AnnouncementWorkflowWizard({ isVillageProperty = false }) {
  return (
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
        انتشار آگهی رأی هیئت (دو نوبت)
      </Typography>

      <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
        اطلاعات انتشار آگهی رأی هیئت تعیین تکلیف را برای هر نوبت در روزنامه‌های کثیرالانتشار و محلی ثبت کنید.
        {isVillageProperty
          ? ' با توجه به روستایی بودن ملک، ثبت تاریخ و پیوست صورتجلسه شورای روستا نیز الزامی است.'
          : null}
      </Alert>

      <Stack spacing={3}>
        {ANNOUNCEMENT_SECTIONS.map((section, index) => (
          <Card key={section.title} variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                {section.title}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  columnGap: 3,
                  rowGap: 2,
                }}
              >
                {section.fields.map((field) => (
                  <Box
                    key={field.name}
                    sx={{ gridColumn: field.type === 'file' ? { xs: 'span 1', md: 'span 2' } : undefined }}
                  >
                    <AnnouncementField field={field} />
                  </Box>
                ))}
              </Box>
              {index < ANNOUNCEMENT_SECTIONS.length - 1 ? <Divider sx={{ mt: 3 }} /> : null}
            </CardContent>
          </Card>
        ))}
        {isVillageProperty ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                {VILLAGE_ANNOUNCEMENT_SECTION.title}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  columnGap: 3,
                  rowGap: 2,
                }}
              >
                {VILLAGE_ANNOUNCEMENT_SECTION.fields.map((field) => (
                  <Box
                    key={field.name}
                    sx={{ gridColumn: field.type === 'file' ? { xs: 'span 1', md: 'span 2' } : undefined }}
                  >
                    <AnnouncementField field={field} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Box>
  );
}
