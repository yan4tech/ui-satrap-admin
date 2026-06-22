import React from 'react';
import { Box, MenuItem, NoSsr } from '@mui/material';
import { Field } from 'src/components/hook-form';

const REPRESENTATION_METHOD_OPTIONS = [
  { value: 'upload_document', label: 'بارگذاری سند نمایندگی' },
  { value: 'official_registry', label: 'استعلام پایگاه اطلاعات اشخاص حقوقی' },
];

export default function Page1() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        columnGap: 3,
        rowGap: 2,
      }}
    >
      <Box>
        <Field.Text name="national_id_asil" label="کد ملی اصیل" />
      </Box>

      {/* نحوه احراز نمایندگی */}
      <Box>
        <Field.Select name="representation_method" label="نحوه احراز نمایندگی">
          {REPRESENTATION_METHOD_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>

      {/* تاریخ سند نمایندگی */}
      <Box>
        <NoSsr>
          <Field.DatePicker
            name="representation_doc_date"
            label="تاریخ سند نمایندگی"
            slotProps={{ textField: { fullWidth: true } }}
          />
        </NoSsr>
      </Box>

      {/* شناسه سند رسمی */}
      <Box>
        <Field.Text name="representation_doc_id" label="شناسه سند رسمی نمایندگی" />
      </Box>

      {/* رمز تصدیق */}
      <Box>
        <Field.Text name="verification_code" label="رمز تصدیق" />
      </Box>

      {/* آپلود تصویر سند */}
      <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
        <Field.Upload
          name="representation_doc_image"
          label="تصویر سند نمایندگی:"
          accept="image/*"
          helperText="انتخاب فایل تصویر"
          width={320}
          height={90}
        />
      </Box>
    </Box>
  );
}
