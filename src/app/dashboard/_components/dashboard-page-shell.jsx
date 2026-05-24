'use client';

import { varAlpha } from 'minimal-shared/utils';

import { Box, Button, Chip, Stack, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { dashboardPageSx, dashboardSectionTitleSx } from './dashboard-styles';

export function DashboardPageShell({
  title,
  subtitle,
  actionLabel,
  badge,
  children,
  accent = 'primary',
}) {
  return (
    <Box sx={dashboardPageSx}>
      <Stack spacing={3}>
        <Box
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: (theme) =>
              `0 1px 2px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            background: (theme) =>
              `linear-gradient(120deg, ${theme.palette[accent].lighter} 0%, ${theme.palette.background.paper} 55%)`,
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="h4" sx={dashboardSectionTitleSx}>
                  {title}
                </Typography>
                {badge ? <Chip size="small" label={badge} color={accent} variant="soft" /> : null}
              </Stack>
              {subtitle ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.75, maxWidth: 720 }}>
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
            {actionLabel ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<Iconify icon="solar:download-minimalistic-bold-duotone" />}
                sx={{ flexShrink: 0, px: 2.5 }}
              >
                {actionLabel}
              </Button>
            ) : null}
          </Stack>
        </Box>
        {children}
      </Stack>
    </Box>
  );
}
