import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Box, Grid, MenuItem, Typography, IconButton, Popover, NoSsr } from '@mui/material';
import { Field } from 'src/components/hook-form';

const REPRESENTATION_METHOD_OPTIONS = [
  { value: 'upload_document', label: 'بارگذاری سند نمایندگی' },
  { value: 'official_registry', label: 'استعلام پایگاه اطلاعات اشخاص حقوقی' },
];

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'بلی' },
  { value: 'no', label: 'خیر' },
];

const REPRESENTATION_STATUS_OPTIONS = [
  { value: 'verified', label: 'نمایندگی احراز شد' },
  { value: 'not_verified', label: 'احراز نشد' },
];

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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Typography variant="body2" sx={{ p: 1.5, maxWidth: 320, lineHeight: 1.7 }}>
          {text}
        </Typography>
      </Popover>
    </>
  );
}

export default function Page1() {
  const { watch } = useFormContext();
  const isDeceased = watch('is_claimant_deceased') === 'yes';
  const applicantRole = watch('applicant_role');
  const representationMethod = watch('representation_method');
  const isLegalRepresentativeCompany = applicantRole === 'legal_representative_company';
  const isLegalRepresentativeIndividual = applicantRole === 'legal_representative_individual';
  const isUploadDocument = representationMethod === 'upload_document';

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
        <Field.Select name="is_claimant_deceased" label="آیا مدعی فوت شده است؟">
          {YES_NO_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Text name="claim_registration_tracking_code" label="کد رهگیری درج ادعا" />
        <InfoHint text="نباید از تاریخ درج ادعا در سامانه بیش از دو سال گذشته باشد. در محیط آزمایشی، این بازه از زمان راه‌اندازی رسمی محاسبه می‌شود." />
      </Box>

      {isDeceased ? (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 2, width: '100%' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                columnGap: 3,
                rowGap: 2,
              }}
            >
              <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' }, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <Field.Text name="deceased_national_id" label="کد ملی متوفی" />
                <InfoHint text="بر اساس گواهی انحصار وراثت (استعلام از ثبت احوال)، یکی از وراث متوفی باید نماینده وراث باشد." />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <NoSsr>
                  <Field.DatePicker
                    name="deceased_date"
                    label="تاریخ فوت مدعی"
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </NoSsr>
                <InfoHint text="مهلت درج گواهی اقدام حداکثر پنج ماه از زمان فوت یا تا سقف مهلت اقدام متوفی (هر کدام بیشتر باشد) است." />
              </Box>
            </Box>
          </Box>
        </Box>
      ) : null}

      {isLegalRepresentativeCompany || isLegalRepresentativeIndividual ? (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            p: 2,
          }}
        >
          {/* <Grid container spacing={2}>
            <Grid item xs={12} md={6}> */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Select name="representation_method" label="نحوه احراز نمایندگی">
              {REPRESENTATION_METHOD_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Field.Select>
            <InfoHint text="اطلاعات پایه (بارگذاری سند نمایندگی / استعلام پایگاه اطلاعات اشخاص حقوقی)." />
          </Box>
          {/* </Grid>
          </Grid> */}
        </Box>
      ) : null}

      {isLegalRepresentativeCompany ? (
        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                  <Field.Text name="legal_entity_national_id" label="شناسه ملی شخص حقوقی" />
                  <InfoHint text="شناسه ملی شخص حقوقی الزامی است." />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      ) : null}
      {/* <Box sx={{ width: { xs: '100%', md: '50%' } }}></Box> */}

      {(isLegalRepresentativeCompany || isLegalRepresentativeIndividual) && isUploadDocument ? (
        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 2 }}>
            <Grid container spacing={2}>
              {isLegalRepresentativeIndividual ? (
                <Grid item xs={12} md={6}>
                  <Field.Text name="national_id_asil" label="کد ملی اصیل" />
                </Grid>
              ) : (
                <Grid item xs={12} md={6} />
              )}

              <Grid item xs={12} md={6}>
                <NoSsr>
                  <Field.DatePicker
                    name="representation_doc_date"
                    label="تاریخ تنظیم سند نمایندگی"
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </NoSsr>
              </Grid>

              <Grid item xs={12} md={6}>
                <Field.Text name="representation_doc_id" label="شناسه سند رسمی نمایندگی" />
              </Grid>

              <Grid item xs={12} md={6}>
                <Field.Text name="verification_code" label="رمز تصدیق" />
              </Grid>
            </Grid>
          </Box>
        </Box>
      ) : null}
      {(isLegalRepresentativeCompany || isLegalRepresentativeIndividual) && isUploadDocument ? (
        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 2 }}>
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
      ) : null}
      {(isLegalRepresentativeCompany || isLegalRepresentativeIndividual) && isUploadDocument ? (
        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 2 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <Field.Text
                  name="legal_expert_national_id"
                  label="کد ملی کارشناس امور ثبتی و حقوقی"
                />
                <InfoHint text="کارشناس باید از افراد مجاز برای کارشناسی انتخاب شود." />
              </Box>
            </Grid>
          </Box>
        </Box>
      ) : null}

      {(isLegalRepresentativeCompany || isLegalRepresentativeIndividual) && isUploadDocument ? (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            p: 2,
            gridColumn: { xs: 'span 1', md: 'span 2' },
          }}
        >
          <Box sx={{ width: { xs: '100%', md: '100%' } }}>
            <Field.Select
              name="expert_representation_result"
              label="نظر کارشناس مبتنی بر احراز نمایندگی"
            >
              {REPRESENTATION_STATUS_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Field.Select>
            <InfoHint text="در صورت عدم احراز نمایندگی توسط کارشناس، ادامه فرآیند امکان‌پذیر نخواهد بود." />
          </Box>

          <Box sx={{ width: '100%', '& .MuiFormControl-root': { width: '100%' } }}>
            <Field.Text name="expert_description" label="توضیحات کارشناس" multiline rows={3} />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
