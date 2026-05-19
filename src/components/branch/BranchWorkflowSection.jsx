'use client';

import { useEffect, useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

import { alpha } from '@mui/material/styles';
import {
  Box,
  Chip,
  Stack,
  Paper,
  MenuItem,
  Typography,
  Collapse,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { Field } from 'src/components/hook-form';
import {
  BRANCH_AFFILIATION,
  REVIEW_POLICY,
  AFFILIATION_OPTIONS,
  REVIEW_POLICY_OPTIONS,
  REVIEW_PARTY_LABELS,
  describeBranchWorkflow,
} from 'src/lib/branch-workflow';

const AFFILIATION_TILES = AFFILIATION_OPTIONS.map((opt) => ({
  ...opt,
  icon:
    opt.value === BRANCH_AFFILIATION.INDEPENDENT
      ? 'solar:buildings-2-bold-duotone'
      : 'solar:case-round-bold-duotone',
  accent: opt.value === BRANCH_AFFILIATION.INDEPENDENT ? 'info' : 'warning',
}));

const REVIEW_TILES = REVIEW_POLICY_OPTIONS.map((opt) => ({
  ...opt,
  hint:
    opt.value === REVIEW_POLICY.REQUIRED ? 'تأیید بازبین' : 'خودکار در فرایند',
  icon: opt.value === REVIEW_POLICY.REQUIRED ? 'solar:shield-check-bold' : 'solar:bolt-bold',
  accent: opt.value === REVIEW_POLICY.REQUIRED ? 'success' : 'secondary',
}));

function ChoiceTile({ selected, disabled, onClick, label, description, hint, icon, accent = 'primary' }) {
  return (
    <Paper
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      elevation={0}
      sx={(theme) => {
        const palette = theme.palette[accent] ?? theme.palette.primary;
        return {
          p: 2.25,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 1.5,
          direction: 'rtl',
          textAlign: 'right',
          borderRadius: 2.5,
          border: '2px solid',
          borderColor: selected ? palette.main : alpha(theme.palette.divider, 0.9),
          bgcolor: selected
            ? alpha(palette.main, theme.palette.mode === 'dark' ? 0.14 : 0.06)
            : theme.palette.background.paper,
          color: 'text.primary',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          position: 'relative',
          overflow: 'hidden',
          transition: theme.transitions.create(
            ['border-color', 'background-color', 'box-shadow', 'transform'],
            { duration: theme.transitions.duration.shorter }
          ),
          boxShadow: selected
            ? `0 8px 24px ${alpha(palette.main, 0.18)}`
            : `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`,
          '&::before': selected
            ? {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                left: 0,
                height: 3,
                bgcolor: palette.main,
              }
            : {},
          '&:hover': disabled
            ? {}
            : {
                transform: 'translateY(-2px)',
                borderColor: selected ? palette.main : palette.light,
                boxShadow: selected
                  ? `0 10px 28px ${alpha(palette.main, 0.22)}`
                  : `0 6px 16px ${alpha(theme.palette.grey[500], 0.12)}`,
              },
        };
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Box
          sx={(theme) => {
            const palette = theme.palette[accent] ?? theme.palette.primary;
            return {
              width: 48,
              height: 48,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              background: selected
                ? `linear-gradient(135deg, ${alpha(palette.main, 0.2)} 0%, ${alpha(palette.main, 0.06)} 100%)`
                : alpha(theme.palette.grey[500], 0.1),
              color: selected ? `${accent}.main` : 'text.secondary',
            };
          }}
        >
          <Iconify icon={icon} width={28} />
        </Box>
        <Box
          sx={(theme) => ({
            width: 22,
            height: 22,
            flexShrink: 0,
            borderRadius: '50%',
            border: '2px solid',
            borderColor: selected ? 'primary.main' : theme.palette.divider,
            bgcolor: selected ? 'primary.main' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: theme.transitions.create(['border-color', 'background-color']),
          })}
        >
          {selected && <Iconify icon="eva:checkmark-fill" width={14} sx={{ color: 'common.white' }} />}
        </Box>
      </Stack>

      <Box sx={{ flex: 1, width: '100%', direction: 'rtl', textAlign: 'right' }}>
        <Typography variant="subtitle2" fontWeight={700} align="right" sx={{ mb: 0.25, width: '100%' }}>
          {label}
        </Typography>
        {hint && (
          <Typography
            variant="caption"
            align="right"
            sx={(theme) => {
              const palette = theme.palette[accent] ?? theme.palette.primary;
              return {
                display: 'block',
                width: '100%',
                mb: 0.75,
                px: 1,
                py: 0.15,
                borderRadius: 1,
                fontWeight: 600,
                color: selected ? `${accent}.dark` : 'text.secondary',
                bgcolor: selected ? alpha(palette.main, 0.1) : alpha(theme.palette.grey[500], 0.1),
              };
            }}
          >
            {hint}
          </Typography>
        )}
        <Typography
          variant="caption"
          color="text.secondary"
          align="right"
          sx={{ lineHeight: 1.65, display: 'block', width: '100%' }}
        >
          {description}
        </Typography>
      </Box>
    </Paper>
  );
}

function WorkflowBlock({ icon, title, subtitle, children }) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2.5,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`,
      })}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ mb: 2 }}>
        <Box
          sx={(theme) => ({
            width: 40,
            height: 40,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
          })}
        >
          <Iconify icon={icon} width={22} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, direction: 'rtl', textAlign: 'right' }}>
          <Typography variant="subtitle2" fontWeight={700} align="right" sx={{ width: '100%' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              color="text.secondary"
              align="right"
              sx={{ lineHeight: 1.5, display: 'block', width: '100%' }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {children}
    </Paper>
  );
}

/**
 * نوع شعبه (مستقل/شرکتی) + سیاست بازبینی.
 * فیلدهای فرم: branch_affiliation, review_policy, company_id
 */
export default function BranchWorkflowSection({
  companies = [],
  readOnly = false,
  canEditAffiliation = true,
  canEditReviewPolicy = true,
  workflowConfig = null,
  lockAffiliation = null,
  lockCompanyId = null,
  hideCompanySelect = false,
}) {
  const { control, watch, setValue } = useFormContext();

  const affiliation = watch('branch_affiliation');
  const reviewPolicy = watch('review_policy');
  const isCorporate = affiliation === BRANCH_AFFILIATION.CORPORATE;
  const isNoReview = reviewPolicy === REVIEW_POLICY.NONE;

  useEffect(() => {
    if (lockAffiliation) {
      setValue('branch_affiliation', lockAffiliation, { shouldDirty: false });
    }
  }, [lockAffiliation, setValue]);

  useEffect(() => {
    if (lockCompanyId != null && Number(lockCompanyId) > 0) {
      setValue('company_id', String(lockCompanyId), { shouldDirty: false });
    }
  }, [lockCompanyId, setValue]);

  useEffect(() => {
    if (affiliation === BRANCH_AFFILIATION.INDEPENDENT) {
      setValue('company_id', '', { shouldDirty: false });
    }
  }, [affiliation, setValue]);

  const affiliationDisabled = readOnly || !canEditAffiliation || Boolean(lockAffiliation);
  const reviewDisabled = readOnly || !canEditReviewPolicy;

  const summaryHint = useMemo(() => {
    if (isNoReview) {
      return 'مرحله بازبینی در فرایند خودکار تکمیل می‌شود.';
    }
    if (isCorporate) {
      return 'بازبینی توسط کاربران بازبینی شرکت.';
    }
    return 'بازبینی توسط سازمان مرکزی.';
  }, [isCorporate, isNoReview]);

  const summaryIcon = isNoReview
    ? 'solar:bolt-circle-bold-duotone'
    : isCorporate
      ? 'solar:users-group-rounded-bold-duotone'
      : 'solar:buildings-3-bold-duotone';

  return (
    <Box
      sx={(theme) => ({
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.04)} 0%, ${alpha(theme.palette.grey[500], theme.palette.mode === 'dark' ? 0.04 : 0.02)} 100%)`,
      })}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={(theme) => ({
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'common.white',
              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
            })}
          >
            <Iconify icon="solar:routing-2-bold-duotone" width={28} />
          </Box>
          <Box sx={{ direction: 'rtl', textAlign: 'right' }}>
            <Typography variant="subtitle1" fontWeight={800} align="right" sx={{ width: '100%' }}>
              نوع شعبه و بازبینی فرم
            </Typography>
            <Typography variant="caption" color="text.secondary" align="right" sx={{ display: 'block', width: '100%' }}>
              مسیر پرونده را با دو انتخاب ساده مشخص کنید
            </Typography>
          </Box>
        </Stack>
        <Chip
          size="medium"
          variant="soft"
          color="primary"
          icon={<Iconify icon="solar:tag-bold" width={16} />}
          label={describeBranchWorkflow(affiliation, reviewPolicy)}
          sx={{ fontWeight: 700, maxWidth: '100%', height: 32 }}
        />
      </Stack>

      {workflowConfig?.review_party && (
        <Chip
          size="small"
          sx={{ mb: 2 }}
          icon={<Iconify icon="solar:info-circle-bold" width={16} />}
          label={`جاری: ${REVIEW_PARTY_LABELS[workflowConfig.review_party] ?? workflowConfig.review_party}`}
          color="info"
          variant="soft"
        />
      )}

      <Stack spacing={2}>
        <WorkflowBlock
          icon="solar:buildings-2-bold-duotone"
          title="نوع شعبه"
          subtitle="مستقل یا زیرمجموعه یک شرکت"
        >
          <Controller
            name="branch_affiliation"
            control={control}
            render={({ field }) => (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.5,
                }}
              >
                {AFFILIATION_TILES.map((tile) => (
                  <ChoiceTile
                    key={tile.value}
                    selected={field.value === tile.value}
                    disabled={affiliationDisabled}
                    label={tile.label}
                    description={tile.description}
                    icon={tile.icon}
                    accent={tile.accent}
                    onClick={() => !affiliationDisabled && field.onChange(tile.value)}
                  />
                ))}
              </Box>
            )}
          />

          <Collapse in={isCorporate && !hideCompanySelect} unmountOnExit>
            <Box
              sx={(theme) => ({
                mt: 2,
                p: 2,
                borderRadius: 2,
                border: `1px dashed ${alpha(theme.palette.warning.main, 0.4)}`,
                bgcolor: alpha(theme.palette.warning.main, 0.06),
              })}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <Iconify icon="solar:case-round-bold" width={20} sx={{ color: 'warning.main' }} />
                <Typography variant="caption" fontWeight={700} color="warning.dark">
                  انتخاب شرکت مادر
                </Typography>
              </Stack>
              <Field.Select
                name="company_id"
                label="شرکت"
                disabled={readOnly || lockCompanyId != null}
                size="small"
              >
                <MenuItem value="">انتخاب شرکت…</MenuItem>
                {companies.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.title}
                    {c.max_branches > 0 ? ` · سقف ${c.max_branches}` : ''}
                  </MenuItem>
                ))}
              </Field.Select>
            </Box>
          </Collapse>
        </WorkflowBlock>

        <WorkflowBlock
          icon="solar:document-text-bold-duotone"
          title="بازبینی فرم"
          subtitle="نیاز به تأیید بازبین قبل از ادامه فرایند"
        >
          <Controller
            name="review_policy"
            control={control}
            render={({ field }) => (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.5,
                }}
              >
                {REVIEW_TILES.map((tile) => (
                  <ChoiceTile
                    key={tile.value}
                    selected={field.value === tile.value}
                    disabled={reviewDisabled}
                    label={tile.label}
                    hint={tile.hint}
                    description={tile.description}
                    icon={tile.icon}
                    accent={tile.accent}
                    onClick={() => !reviewDisabled && field.onChange(tile.value)}
                  />
                ))}
              </Box>
            )}
          />
        </WorkflowBlock>
      </Stack>

      <Paper
        elevation={0}
        sx={(theme) => ({
          mt: 2,
          p: 1.75,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.25,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.info.main, 0.24)}`,
          bgcolor: alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.12 : 0.06),
        })}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1.5,
            bgcolor: (theme) => alpha(theme.palette.info.main, 0.12),
            color: 'info.main',
          }}
        >
          <Iconify icon={summaryIcon} width={22} />
        </Box>
        <Box sx={{ flex: 1, direction: 'rtl', textAlign: 'right' }}>
          <Typography
            variant="caption"
            fontWeight={700}
            color="info.dark"
            align="right"
            sx={{ display: 'block', mb: 0.25, width: '100%' }}
          >
            نتیجه انتخاب
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            align="right"
            sx={{ lineHeight: 1.65, display: 'block', width: '100%' }}
          >
            {summaryHint}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
