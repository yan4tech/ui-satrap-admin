'use client';

import { Icon } from '@iconify/react';
import { Box, Paper, Stack, Typography, alpha } from '@mui/material';

export function StatusToggleCard({
  title,
  hint,
  icon,
  value,
  onChange,
  readOnly,
  disabled,
  positive,
  negative,
}) {
  const isPositive = value === positive.value;
  const paletteKey = isPositive ? positive.color : negative.color;

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        p: 2,
        height: '100%',
        borderRadius: 2.5,
        borderColor: alpha(theme.palette[paletteKey].main, isPositive ? 0.45 : 0.2),
        bgcolor: alpha(theme.palette[paletteKey].main, isPositive ? 0.08 : 0.03),
        transition: theme.transitions.create(['border-color', 'background-color', 'box-shadow'], {
          duration: theme.transitions.duration.shortest,
        }),
        ...(isPositive && {
          boxShadow: `0 8px 24px ${alpha(theme.palette[paletteKey].main, 0.12)}`,
        }),
        ...(disabled && { opacity: 0.72 }),
      })}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Box
          sx={(theme) => ({
            width: 44,
            height: 44,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: `${paletteKey}.main`,
            bgcolor: alpha(theme.palette[paletteKey].main, 0.14),
          })}
        >
          <Icon icon={icon} width={24} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {title}
          </Typography>
          {hint && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              {hint}
            </Typography>
          )}
        </Box>
      </Stack>

      <Stack direction="row" spacing={1}>
        {[positive, negative].map((option) => {
          const selected = value === option.value;
          return (
            <Box
              key={String(option.value)}
              component="button"
              type="button"
              disabled={readOnly || disabled}
              onClick={() => onChange(option.value)}
              sx={(theme) => ({
                flex: 1,
                py: 1.25,
                px: 1.5,
                border: '2px solid',
                borderRadius: 2,
                cursor: readOnly || disabled ? 'not-allowed' : 'pointer',
                font: 'inherit',
                fontSize: theme.typography.body2.fontSize,
                fontWeight: selected ? 700 : 500,
                textAlign: 'center',
                transition: theme.transitions.create(['border-color', 'background-color', 'color'], {
                  duration: theme.transitions.duration.shortest,
                }),
                borderColor: selected
                  ? theme.palette[option.color].main
                  : alpha(theme.palette.divider, 0.9),
                bgcolor: selected
                  ? alpha(theme.palette[option.color].main, 0.14)
                  : theme.palette.background.paper,
                color: selected
                  ? theme.palette[option.color].dark
                  : theme.palette.text.secondary,
                '&:hover': {
                  ...(!readOnly &&
                    !disabled && {
                      borderColor: theme.palette[option.color].main,
                      bgcolor: alpha(theme.palette[option.color].main, 0.08),
                    }),
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette[option.color].main}`,
                  outlineOffset: 2,
                },
              })}
            >
              <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center">
                <Icon icon={option.icon} width={18} />
                <span>{option.label}</span>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

const DEFAULT_ACTIVE_OPTIONS = {
  positive: {
    value: true,
    label: 'فعال',
    color: 'success',
    icon: 'solar:check-circle-bold',
  },
  negative: {
    value: false,
    label: 'غیرفعال',
    color: 'error',
    icon: 'solar:close-circle-bold',
  },
};

/**
 * @param {{
 *   sectionTitle?: string,
 *   sectionIcon?: string,
 *   title?: string,
 *   hint?: string,
 *   icon?: string,
 *   value: boolean,
 *   onChange: (value: boolean) => void,
 *   readOnly?: boolean,
 *   disabled?: boolean,
 *   fullWidth?: boolean,
 * }} props
 */
export function ActiveStatusField({
  sectionTitle = 'وضعیت',
  sectionIcon = 'solar:shield-check-bold',
  title = 'وضعیت',
  hint = '',
  icon = 'solar:settings-bold',
  value,
  onChange,
  readOnly = false,
  disabled = false,
  fullWidth = true,
}) {
  return (
    <Box sx={fullWidth ? { width: '100%' } : { maxWidth: { md: 480 } }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 2.5,
          bgcolor: 'background.neutral',
          borderStyle: 'dashed',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Icon icon={sectionIcon} width={22} />
          <Typography variant="subtitle1" fontWeight={700}>
            {sectionTitle}
          </Typography>
        </Stack>
        <StatusToggleCard
          title={title}
          hint={hint}
          icon={icon}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          disabled={disabled || readOnly}
          positive={DEFAULT_ACTIVE_OPTIONS.positive}
          negative={DEFAULT_ACTIVE_OPTIONS.negative}
        />
      </Paper>
    </Box>
  );
}
