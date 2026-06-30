import React from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Box, Button, IconButton, MenuItem, Popover, Typography } from '@mui/material';

import { Field } from 'src/components/hook-form';

import {
  VISIT_OTHER_ENTRY_TYPES,
  createEmptyVisitOtherDocumentInquiry,
} from '../schemas';

function InfoHint({ text }) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton size="small" color="info" onClick={handleOpen} sx={{ mt: 1, p: 0.5 }}>
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
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Typography sx={{ p: 1.5, maxWidth: 320 }} variant="body2">
          {text}
        </Typography>
      </Popover>
    </>
  );
}

function AttachmentUpload({ name, label, hint }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {label}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Box
              component="label"
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minHeight: 90,
                px: 2,
                border: '1px solid',
                borderColor: error ? 'error.main' : 'text.primary',
                cursor: 'pointer',
                backgroundColor: 'background.paper',
                overflow: 'hidden',
                flex: 1,
              }}
            >
              <input
                type="file"
                accept="image/*,.pdf"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  field.onChange(file);
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
                  `فایل ${label} را انتخاب کنید`}
              </Typography>
            </Box>
            {hint ? <InfoHint text={hint} /> : null}
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

export default function OtherDocumentsInquiriesStep() {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'expertVisit.visit_other_documents_inquiries',
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="body2" color="text.secondary">
        در صورت وجود سایر مستندات یا استعلامات مرتبط با بازدید، هر مورد را با نوع (مستند/استعلام)، عنوان،
        تاریخ، شرح و پیوست ثبت کنید. این بخش اختیاری است.
      </Typography>

      {fields.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          هنوز موردی ثبت نشده است.
        </Typography>
      ) : null}

      {fields.map((field, index) => (
        <Box
          key={field.id}
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              مورد {index + 1}
            </Typography>
            <Button color="error" size="small" onClick={() => remove(index)}>
              حذف
            </Button>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              columnGap: 3,
              rowGap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Field.Select
                name={`expertVisit.visit_other_documents_inquiries.${index}.entry_type`}
                label="نوع (مستند/استعلام)"
                fullWidth
              >
                {VISIT_OTHER_ENTRY_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>
              <InfoHint text="مشخص کنید این مورد مستند است یا پاسخ/درخواست استعلام." />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Field.Text
                name={`expertVisit.visit_other_documents_inquiries.${index}.title`}
                label="عنوان"
                fullWidth
              />
              <InfoHint text="عنوان مستند یا استعلام (مثلاً استعلام شهرداری، سند اجاره)." />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Field.Text
                name={`expertVisit.visit_other_documents_inquiries.${index}.reference_date`}
                label="تاریخ"
                fullWidth
              />
              <InfoHint text="تاریخ صدور مستند یا تاریخ استعلام/پاسخ." />
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
              <Field.Text
                name={`expertVisit.visit_other_documents_inquiries.${index}.description`}
                label="شرح"
                multiline
                rows={3}
                fullWidth
              />
            </Box>

            <AttachmentUpload
              name={`expertVisit.visit_other_documents_inquiries.${index}.attachment_image`}
              label="پیوست"
              hint="تصویر یا فایل PDF مستند یا پاسخ استعلام."
            />
          </Box>
        </Box>
      ))}

      <Box>
        <Button variant="outlined" onClick={() => append(createEmptyVisitOtherDocumentInquiry())}>
          افزودن مستند/استعلام
        </Button>
      </Box>
    </Box>
  );
}
