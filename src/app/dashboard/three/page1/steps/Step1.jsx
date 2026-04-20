import React from 'react';
import { Grid, MenuItem, Typography } from '@mui/material';
import { Field } from 'src/components/hook-form';

const REPRESENTATION_METHOD_OPTIONS = [
  { value: 'upload_document', label: 'بارگذاری سند نمایندگی' },
  { value: 'official_registry', label: 'استعلام پایگاه اطلاعات اشخاص حقوقی' },
];

export default function Page1() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Field.Text name="national_id_asil" label="کد ملی اصیل" />
      </Grid>

      {/* شناسه ملی */}
      <Grid item xs={12} md={6}>
        <Field.Text name="national_id" label="شناسه ملی" />
      </Grid>

      {/* نحوه احراز نمایندگی */}
      <Grid item xs={12} md={6}>
        <Field.Select name="representation_method" label="نحوه احراز نمایندگی">
          {REPRESENTATION_METHOD_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Grid>

      {/* تاریخ سند نمایندگی */}
      <Grid item xs={12} md={4}>
        <Field.Text name="representation_doc_date" label="تاریخ سند نمایندگی" />
      </Grid>

      {/* شناسه سند رسمی */}
      <Grid item xs={12} md={4}>
        <Field.Text name="representation_doc_id" label="شناسه سند رسمی نمایندگی" />
      </Grid>

      {/* رمز تصدیق */}
      <Grid item xs={12} md={4}>
        <Field.Text name="verification_code" label="رمز تصدیق" />
      </Grid>

      {/* آپلود تصویر سند */}
      <Grid item xs={12}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          تصویر سند نمایندگی
        </Typography>

        <Field.Upload
          name="representation_doc_image"
          accept="image/*"
          maxSize={5242880} // 5MB
        />
      </Grid>
    </Grid>
  );
}
