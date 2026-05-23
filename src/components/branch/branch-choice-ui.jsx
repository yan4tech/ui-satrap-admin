'use client';

import { alpha } from '@mui/material/styles';
import { Box, Paper, Stack, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';

export function ChoiceTile({
  selected,
  disabled,
  onClick,
  label,
  description,
  hint,
  icon,
  accent = 'primary',
}) {
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

export function WorkflowBlock({ icon, title, subtitle, children }) {
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
