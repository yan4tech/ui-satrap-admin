import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Box, MenuItem, Typography, IconButton, Popover, NoSsr } from '@mui/material';
import { Field } from 'src/components/hook-form';

const REPRESENTATION_METHOD_OPTIONS = [
  { value: 'upload_document', label: 'بارگذاری سند نمایندگی' },
  { value: 'official_registry', label: 'استعلام پایگاه اطلاعات اشخاص حقوقی' },
];

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'بلی' },
  { value: 'no', label: 'خیر' },
];

const CLAIM_MAP_MATCH_OPTIONS = [
  { value: 'yes', label: 'بله' },
  { value: 'partial', label: 'بخشی از آن' },
  { value: 'no', label: 'خیر', disabled: true },
];

const CLAIM_OWNERSHIP_TYPE_OPTIONS = [
  { value: 'ownership_of_ain', label: 'مالکیت عین' },
  { value: 'easement_right', label: 'حق ارتفاق', disabled: true },
  { value: 'usufruct_right', label: 'حق انتفاع', disabled: true },
  { value: 'beneficial_ownership', label: 'مالکیت منافع', disabled: true },
];

const CLAIM_BELONGS_TO_APPLICANT_OPTIONS = [
  { value: 'yes', label: 'بلی' },
  { value: 'no', label: 'خیر', disabled: true },
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

function ConditionalSection({ title, children }) {
  return (
    <Box
      sx={{
        gridColumn: '1 / -1',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        p: 2,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          columnGap: 3,
          rowGap: 2,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function RepresentationDocImageUpload({ control }) {
  return (
    <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
      <Controller
        name="representation_doc_image"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Box>
            <Typography variant="body2">تصویر سند نمایندگی:</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Box
                component="label"
                sx={{
                  position: 'relative',
                  width: 320,
                  height: 90,
                  border: '1px solid',
                  borderColor: error ? 'error.main' : 'text.primary',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    field.onChange(file);
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '90%',
                    borderTop: '1px solid',
                    borderColor: 'text.secondary',
                    transform: 'translate(-50%, -50%) rotate(18deg)',
                    pointerEvents: 'none',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '90%',
                    borderTop: '1px solid',
                    borderColor: 'text.secondary',
                    transform: 'translate(-50%, -50%) rotate(-18deg)',
                    pointerEvents: 'none',
                  }}
                />
              </Box>
            </Box>

            {field.value?.name ? (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                فایل انتخاب‌شده: {field.value.name}
              </Typography>
            ) : null}

            {error?.message ? (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {error.message}
              </Typography>
            ) : null}
          </Box>
        )}
      />
    </Box>
  );
}

export default function Page1() {
  const { control, watch } = useFormContext();
  const claimMapMatchStatus = watch('claim_map_match_status');
  const isPartialMapMatch = claimMapMatchStatus === 'partial';
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

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Select name="claim_map_match_status" label="وضعیت تطابق نقشه ادعا">
          {CLAIM_MAP_MATCH_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value} disabled={Boolean(o.disabled)}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
        <InfoHint text="در صورت عدم تطابق نقشه ادعا، پرونده در این مرحله رد می‌شود." />
      </Box>

      {isPartialMapMatch ? (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Field.Text name="subsidiary_map_tracking_code" label="کد رهگیری نقشه فرعی" />
          <InfoHint text="متقاضی باید دسترسی مانا به نقشه فرعی را در سامانه ژئوا داشته باشد." />
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Select name="claim_ownership_type" label="نوع ادعا">
          {CLAIM_OWNERSHIP_TYPE_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value} disabled={Boolean(o.disabled)}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
        <InfoHint text="مطابق الزامات، نوع ادعا باید مالکیت عین باشد." />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Select name="claim_belongs_to_applicant" label="آیا ادعا متعلق به متقاضی است؟">
          {CLAIM_BELONGS_TO_APPLICANT_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value} disabled={Boolean(o.disabled)}>
              {o.label}
            </MenuItem>
          ))}
        </Field.Select>
        <InfoHint text="ادعا باید متعلق به متقاضی باشد." />
      </Box>

      {isDeceased ? (
        <ConditionalSection title="اطلاعات مدعی متوفی">
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
        </ConditionalSection>
      ) : null}

      {isLegalRepresentativeCompany ? (
        <ConditionalSection title="اقلام اطلاعاتی نماینده شخص حقوقی">
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Text name="legal_entity_national_id" label="شناسه ملی شخص حقوقی" />
            <InfoHint text="شناسه ملی شخص حقوقی الزامی است." />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Select name="representation_method" label="نحوه احراز نمایندگی">
              {REPRESENTATION_METHOD_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Field.Select>
            <InfoHint text="در صورتی که گزینه «استعلام پایگاه اطلاعات اشخاص حقوقی» انتخاب شود، پایگاه باید متقاضی را به عنوان نماینده شخص حقوقی ثبت کرده باشد." />
          </Box>

          {isUploadDocument ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <NoSsr>
                  <Field.DatePicker
                    name="representation_doc_date"
                    label="تاریخ تنظیم سند نمایندگی"
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </NoSsr>
                <InfoHint text="تاریخ تنظیم سند نمایندگی الزامی است." />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <Field.Text name="representation_doc_id" label="شناسه سند رسمی نمایندگی" />
                <InfoHint text="شناسه سند رسمی نمایندگی الزامی است." />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <Field.Text name="verification_code" label="رمز تصدیق" />
                <InfoHint text="رمز تصدیق الزامی است." />
              </Box>

              <RepresentationDocImageUpload control={control} />
            </>
          ) : null}
        </ConditionalSection>
      ) : null}

      {isLegalRepresentativeIndividual ? (
        <ConditionalSection title="اقلام اطلاعاتی نماینده قانونی شخص حقیقی">
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Text name="national_id_asil" label="کد ملی اصیل" />
            <InfoHint text="کد ملی اصیل الزامی است و اصیل باید در قید حیات باشد." />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Text name="principal_postal_code" label="کد پستی اصیل" />
            <InfoHint text="کد پستی اصیل باید ۱۰ رقم باشد." />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <NoSsr>
              <Field.DatePicker
                name="representation_doc_date"
                label="تاریخ تنظیم سند نمایندگی"
                slotProps={{ textField: { fullWidth: true } }}
              />
            </NoSsr>
            <InfoHint text="تاریخ تنظیم سند نمایندگی الزامی است." />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Text name="representation_doc_id" label="شناسه سند رسمی نمایندگی" />
            <InfoHint text="شناسه سند رسمی نمایندگی الزامی است." />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Field.Text name="verification_code" label="رمز تصدیق" />
            <InfoHint text="رمز تصدیق الزامی است." />
          </Box>

          <RepresentationDocImageUpload control={control} />
        </ConditionalSection>
      ) : null}

    </Box>
  );
}
