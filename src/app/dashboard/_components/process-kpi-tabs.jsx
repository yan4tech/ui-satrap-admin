'use client';

import { useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import { Box, Chip, Grid, Stack, Tab, Tabs, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { ServiceLabel } from 'src/components/service-label';

import { toFaDigits } from './to-fa-digits';
import { DashboardCard } from './dashboard-card';
import { dashboardSectionTitleSx } from './dashboard-styles';

export function ProcessKpiTabs({ data }) {
  const [activeProvince, setActiveProvince] = useState(data?.[0]?.province ?? '');

  const currentProvince = data.find((item) => item.province === activeProvince) ?? data[0];

  return (
    <DashboardCard hover={false}>
      <Box sx={{ px: 2.5, pt: 2.5, pb: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="solar:map-point-bold-duotone" width={24} sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={dashboardSectionTitleSx}>
            تعداد خدمات به تفکیک استان
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 1 }}>
          مقایسه موفق، ناموفق و در حال بررسی در هر استان
        </Typography>
      </Box>

      <Tabs
        value={activeProvince}
        onChange={(_, value) => setActiveProvince(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          px: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiTab-root': { fontWeight: 600, minHeight: 48 },
        }}
      >
        {data.map((item) => (
          <Tab key={item.province} value={item.province} label={`استان ${item.province}`} />
        ))}
      </Tabs>

      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Grid container spacing={2}>
          {currentProvince.services.map((service) => (
            <Grid key={`${currentProvince.province}-${service.name}`} size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.04),
                  height: '100%',
                }}
              >
                <ServiceLabel label={service.name} variant="card" sx={{ mb: 1.5 }} />

                {[
                  { key: 'success', label: 'موفق', color: 'success' },
                  { key: 'failed', label: 'ناموفق', color: 'error' },
                  { key: 'inReview', label: 'در دست بررسی', color: 'warning' },
                ].map((row, index) => (
                  <Stack
                    key={row.key}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      mb: index < 2 ? 1 : 0,
                      py: 0.75,
                      px: 1,
                      borderRadius: 1.5,
                      bgcolor: (theme) =>
                        varAlpha(theme.vars.palette[row.color].mainChannel, 0.06),
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {row.label}
                    </Typography>
                    <Chip
                      label={toFaDigits(service[row.key])}
                      color={row.color}
                      size="small"
                      variant="soft"
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </DashboardCard>
  );
}
