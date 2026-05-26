import { varAlpha } from 'minimal-shared/utils';

import { Avatar, Box, Grid, Stack, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { DashboardCard } from './dashboard-card';
import { toFaDigits } from './to-fa-digits';

const trendIcon = {
  up: 'solar:arrow-up-bold',
  down: 'solar:arrow-down-bold',
};

export function KpiGrid({ items }) {
  return (
    <Grid container spacing={2}>
      {items.map((item) => {
        const accent = item.avatarColor?.split('.')[0] ?? 'primary';

        return (
          <Grid key={item.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <DashboardCard>
              <Stack direction="row" spacing={2} sx={{ p: 2.5 }} alignItems="center">
                <Avatar
                  variant="rounded"
                  sx={{
                    bgcolor: item.avatarBg ?? `${accent}.lighter`,
                    color: item.avatarColor ?? `${accent}.main`,
                    width: 56,
                    height: 56,
                    boxShadow: (theme) =>
                      `0 4px 12px ${varAlpha(theme.vars.palette[accent].mainChannel, 0.2)}`,
                  }}
                >
                  <Iconify icon={item.icon} width={28} />
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.25 }}>
                    {item.title}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {toFaDigits(item.value)}
                  </Typography>
                  {item.subtitle ? (
                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                      {toFaDigits(item.subtitle)}
                    </Typography>
                  ) : null}
                  {item.change ? (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                      {item.trend ? (
                        <Iconify
                          icon={trendIcon[item.trend]}
                          width={16}
                          sx={{
                            color: item.trend === 'up' ? 'success.main' : 'error.main',
                          }}
                        />
                      ) : null}
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: item.trend === 'up' ? 'success.main' : 'error.main',
                        }}
                      >
                        {toFaDigits(item.change)}
                      </Typography>
                    </Stack>
                  ) : null}
                </Box>
              </Stack>
            </DashboardCard>
          </Grid>
        );
      })}
    </Grid>
  );
}
