import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  Alert,
  Box,
  Chip,
  IconButton,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { Field } from 'src/components/hook-form';

import { shouldRequireExpertRepresentationFields } from '../schemas';

const REPRESENTATION_STATUS_OPTIONS = [
  { value: 'verified', label: 'نمایندگی احراز شد' },
  { value: 'not_verified', label: 'احراز نشد' },
];

const EXPERT_RESULT_META = {
  verified: { label: 'نمایندگی احراز شد', color: 'success', severity: 'success' },
  not_verified: { label: 'احراز نشد', color: 'error', severity: 'error' },
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

function ExpertRepresentationReadOnly({ expertId, result, description }) {
  const meta = EXPERT_RESULT_META[result] ?? {
    label: 'در انتظار بررسی کارشناس',
    color: 'warning',
    severity: 'warning',
  };
  const hasExpertInput = Boolean(expertId.trim() || result || description.trim());

  return (
    <Box
      sx={{
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
      }}
    >
      <Alert severity={meta.severity} sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="body2" fontWeight={700}>
            نظر کارشناسی احراز نمایندگی (ماده ۱۱)
          </Typography>
          <Chip label={meta.label} color={meta.color} size="small" variant="outlined" />
        </Stack>
      </Alert>

      <Stack spacing={1.5}>
        <TextField
          fullWidth
          label="کد ملی کارشناس امور ثبتی و حقوقی"
          value={expertId}
          InputProps={{ readOnly: true }}
          placeholder="هنوز ثبت نشده است."
        />
        <TextField
          fullWidth
          multiline
          rows={2}
          label="توضیحات کارشناس"
          value={description}
          InputProps={{ readOnly: true }}
          placeholder="هنوز توضیحی توسط کارشناس ثبت نشده است."
          helperText={
            hasExpertInput
              ? 'در صورت ثبت توضیح توسط کارشناس، در این بخش نمایش داده می‌شود.'
              : 'این بخش توسط کارشناس احراز نمایندگی تکمیل می‌شود.'
          }
        />
      </Stack>
    </Box>
  );
}

/**
 * UI کارشناس احراز نمایندگی — الگو از service2/three Step1 + ApplicantReviewFeedback در WorkflowWizard.
 */
export default function ExpertRepresentationReview({ isAgencyExpert = false, readOnly = false }) {
  const { control } = useFormContext();
  const applicantRole = useWatch({ control, name: 'applicant_role' });
  const representationMethod = useWatch({ control, name: 'representation_method' });
  const expertId = useWatch({ control, name: 'legal_expert_national_id' }) ?? '';
  const result = useWatch({ control, name: 'expert_representation_result' }) ?? '';
  const description = useWatch({ control, name: 'expert_description' }) ?? '';

  const shouldShow = shouldRequireExpertRepresentationFields({
    applicant_role: applicantRole,
    representation_method: representationMethod,
  });

  if (!shouldShow) return null;

  const editable = isAgencyExpert && !readOnly;

  if (!editable) {
    return (
      <ExpertRepresentationReadOnly
        expertId={String(expertId)}
        result={String(result)}
        description={String(description)}
      />
    );
  }

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        p: 2,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        اقلام اطلاعاتی کارشناس احراز نمایندگی (ماده ۱۱)
      </Typography>

      <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
        این بخش توسط کارشناس احراز نمایندگی تکمیل می‌شود.
      </Alert>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          columnGap: 3,
          rowGap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Field.Text name="legal_expert_national_id" label="کد ملی کارشناس امور ثبتی و حقوقی" />
          <InfoHint text="کارشناس باید از افراد مجاز برای کارشناسی موضوع ماده ۴ دستورالعمل باشد." />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Field.Select name="expert_representation_result" label="نظر کارشناسی مبنی بر احراز نمایندگی">
            {REPRESENTATION_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Field.Select>
          <InfoHint text="در صورت عدم احراز نمایندگی توسط کارشناس، ادامه فرایند انجام نخواهد شد." />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
          <Field.Text name="expert_description" label="توضیحات کارشناس" multiline rows={3} />
        </Box>
      </Box>
    </Box>
  );
}
