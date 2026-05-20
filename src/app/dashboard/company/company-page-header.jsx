'use client';

import { Icon } from '@iconify/react';
import { Box, Chip, Stack, Typography } from '@mui/material';

/**
 * @param {{ title: string, subtitle: string, badge?: string, icon?: string }} props
 */
export default function CompanyPageHeader({
  title,
  subtitle,
  badge = 'فرم شرکت',
  icon = 'solar:buildings-2-bold',
}) {
  return (
    <Box
      sx={{
        mb: 3,
        px: { xs: 2, md: 3 },
        py: 2.5,
        borderRadius: 2.5,
        color: 'primary.contrastText',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.info.main} 100%)`,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              mt: 0.25,
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.22)',
              flexShrink: 0,
            }}
          >
            <Icon icon={icon} width={26} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
              {subtitle}
            </Typography>
          </Box>
        </Stack>
        <Chip
          label={badge}
          sx={{
            color: 'common.white',
            bgcolor: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.28)',
            flexShrink: 0,
          }}
        />
      </Stack>
    </Box>
  );
}

export const companySectionPaperSx = {
  borderRadius: 2.5,
  p: { xs: 2, md: 3 },
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.neutral',
};
