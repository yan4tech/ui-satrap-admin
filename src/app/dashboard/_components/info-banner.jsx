import { varAlpha } from 'minimal-shared/utils';

import { Avatar, Box, Card, Chip, Stack, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { dashboardCardStaticSx } from './dashboard-styles';

export function InfoBanner({
  title,
  subtitle,
  icon,
  avatarLetter,
  chips = [],
  accent = 'primary',
}) {
  const paletteKey = accent === 'info' ? 'info' : 'primary';

  return (
    <Card
      sx={[
        dashboardCardStaticSx,
        {
          overflow: 'hidden',
          '&:hover': { transform: 'none', boxShadow: dashboardCardStaticSx.boxShadow },
        },
      ]}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{
          p: 2.5,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette[paletteKey].lighter} 0%, ${theme.palette.background.paper} 62%)`,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            variant="rounded"
            sx={{
              width: 56,
              height: 56,
              bgcolor: `${paletteKey}.main`,
              color: `${paletteKey}.contrastText`,
              boxShadow: (theme) =>
                `0 4px 12px ${varAlpha(theme.vars.palette[paletteKey].mainChannel, 0.32)}`,
            }}
          >
            {avatarLetter ? (
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {avatarLetter}
              </Typography>
            ) : (
              <Iconify icon={icon} width={28} />
            )}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
              {subtitle}
            </Typography>
          </Box>
        </Stack>
        {chips.length > 0 ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {chips.map((chip) => (
              <Chip key={chip.label} {...chip} />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
}
