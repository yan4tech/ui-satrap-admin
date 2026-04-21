import React from 'react';
import { useFormContext } from 'react-hook-form';
import { MenuItem, Box, IconButton, Popover, Typography } from '@mui/material';
import { Field } from 'src/components/hook-form';

const APPLICANT_ROLE_OPTIONS = [
  { value: 'legal_representative_individual', label: 'نماینده قانونی شخص حقیقی' },
  { value: 'original', label: 'اصیل' },
  { value: 'legal_representative_company', label: 'نماینده شخص حقوقی' },
];

const SANA_STATUS_OPTIONS = [
  { value: 'registered', label: 'در سامانه ثنا ثبت نام کرده است' },
  { value: 'not_registered', label: 'در سامانه ثنا ثبت نام نکرده است' },
];

const NOTE5_AWARENESS_OPTIONS = [
  { value: 'aware', label: 'مطلع هستم' },
  { value: 'not_aware', label: 'مطلع نیستم' },
];

const REPRESENTATION_VERIFICATION_OPTIONS = [
  { value: 'document_upload', label: 'بارگذاری سند نمایندگی' },
  { value: 'legal_persons_registry_check', label: 'استعلام پایگاه اطلاعات اشخاص حقوقی' },
];

const EXPERT_REPRESENTATION_OPINION_OPTIONS = [
  { value: 'verified', label: 'احراز شده' },
  { value: 'not_verified', label: 'احراز نشده' },
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
        <Typography variant="body2" sx={{ p: 1.5, maxWidth: 280, lineHeight: 1.7 }}>
          {text}
        </Typography>
      </Popover>
    </>
  );
}

export default function Page0() {
  const { watch } = useFormContext();
  const applicantRole = watch('applicant_role');
  const representationVerificationMethod = watch('representation_verification_method');
  const shouldShowArticle11Fields =
    applicantRole === 'legal_representative_individual' ||
    (applicantRole === 'legal_representative_company' &&
      representationVerificationMethod === 'document_upload');

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        columnGap: 3,
        rowGap: 2,
      }}
    >
      {/* کد ملی متقاضی */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Text name="national_id" label="کد ملی متقاضی" />
        <InfoHint text="متقاضی باید دارای شرط سن قانونی (بالای 18 سال) و رشد ثابت شده باشد." />
      </Box>

      {/* شماره تلفن */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Text name="applicant_mobile" label="شماره تلفن همراه متقاضی" />
        <InfoHint text="شماره تلفن باید در سامانه شاهکار به نام متقاضی ثبت شده باشد." />
      </Box>

      {/* وضعیت ثبت نام در سامانه ثنا */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Select
          name="sana_registration_status"
          label="وضعیت ثبت نام متقاضی در سامانه ثنا قوه قضاییه"
        >
          {SANA_STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
        <InfoHint text="متقاضی باید در سامانه ثنا ثبت نام کرده باشد." />
      </Box>

      {/* سمت متقاضی (کمبو باکس) */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Select name="applicant_role" label="سمت متقاضی">
          {APPLICANT_ROLE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
        <InfoHint text="اطلاعات پایه (اصیل / نماینده قانونی شخص حقیقی / نماینده شخص حقوقی)." />
      </Box>

      {applicantRole === 'legal_representative_company' && (
        <>
          {/* شناسه ملی شخص حقوقی */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Text name="company_national_id" label="شناسه ملی شخص حقوقی" />
            <InfoHint text="شناسه ملی شخص حقوقی الزامی است." />
          </Box>

          {/* نحوه احراز نمایندگی */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Select name="representation_verification_method" label="نحوه احراز نمایندگی">
              {REPRESENTATION_VERIFICATION_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>
            <InfoHint text="در صورتی که گزینه «استعلام پایگاه اطلاعات اشخاص حقوقی» انتخاب شود، پایگاه باید متقاضی را به عنوان نماینده شخص حقوقی ثبت کرده باشد." />
          </Box>

          {representationVerificationMethod === 'document_upload' && (
            <>
              {/* تصویر سند نمایندگی */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <Field.Text name="representation_document_image" label="تصویر سند نمایندگی" />
                <InfoHint text="ارسال تصویر سند نمایندگی الزامی است." />
              </Box>

              {/* تاریخ تنظیم سند نمایندگی */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <Field.Text
                  name="representation_document_date"
                  label="تاریخ تنظیم سند نمایندگی"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <InfoHint text="تاریخ تنظیم سند نمایندگی الزامی است." />
              </Box>

              {/* شناسه سند رسمی نمایندگی */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <Field.Text name="official_representation_document_id" label="شناسه سند رسمی نمایندگی" />
                <InfoHint text="این فیلد اختیاری است." />
              </Box>

              {/* رمز تصدیق */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <Field.Text name="verification_code" label="رمز تصدیق" />
                <InfoHint text="این فیلد اختیاری است." />
              </Box>
            </>
          )}
        </>
      )}

      {applicantRole === 'legal_representative_individual' && (
        <>
          {/* کد ملی اصیل */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Text name="principal_national_id" label="کد ملی اصیل" />
            <InfoHint text="کد ملی اصیل الزامی است و اصیل باید در قید حیات باشد." />
          </Box>

          {/* تصویر سند رسمی نمایندگی */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Text name="official_representation_document_image" label="تصویر سند رسمی نمایندگی" />
            <InfoHint text="ارسال تصویر سند رسمی نمایندگی الزامی است." />
          </Box>

          {/* تاریخ تنظیم سند نمایندگی */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Text
              name="official_representation_document_date"
              label="تاریخ تنظیم سند نمایندگی"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <InfoHint text="تاریخ تنظیم سند نمایندگی الزامی است." />
          </Box>

          {/* شناسه سند رسمی نمایندگی */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Text name="individual_official_document_id" label="شناسه سند رسمی نمایندگی" />
            <InfoHint text="این فیلد اختیاری است." />
          </Box>

          {/* رمز تصدیق */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Text name="individual_verification_code" label="رمز تصدیق" />
            <InfoHint text="این فیلد اختیاری است." />
          </Box>
        </>
      )}

      {shouldShowArticle11Fields && (
        <>
          {/* کد ملی کارشناس امور ثبتی و حقوقی */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Text name="expert_national_id" label="کد ملی کارشناس امور ثبتی و حقوقی" />
            <InfoHint text="کارشناس باید از افراد مجاز برای کارشناسی موضوع ماده ۴ دستورالعمل باشد." />
          </Box>

          {/* نظر کارشناسی مبنی بر احراز نمایندگی */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Select name="expert_representation_opinion" label="نظر کارشناسی مبنی بر احراز نمایندگی">
              {EXPERT_REPRESENTATION_OPINION_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>
            <InfoHint text="در صورت عدم احراز نمایندگی توسط کارشناس، ادامه فرایند انجام نخواهد شد." />
          </Box>

          {/* توضیحات کارشناس */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Text name="expert_description" label="توضیحات کارشناس" />
            <InfoHint text="این فیلد اختیاری است." />
          </Box>
        </>
      )}

      {/* اعلام اطلاع متقاضی از مفاد تبصره ۵ ماده ۱۰ قانون */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Select name="note5_acknowledgment" label="اعلام اطلاع متقاضی از مفاد تبصره ۵ ماده ۱۰ قانون">
          {NOTE5_AWARENESS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
        <InfoHint text="متقاضی باید از مفاد تبصره مذکور مطلع باشد." />
      </Box>

      {/* کد رهگیری نقشه */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Text name="map_tracking_code" label="کد رهگیری نقشه" />
        <InfoHint text="متقاضی باید مجوز دسترسی به این نقشه را در سامانه ژئوا داشته باشد." />
      </Box>
    </Box>
  );
}
