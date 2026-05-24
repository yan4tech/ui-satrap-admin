import { varAlpha } from 'minimal-shared/utils';

import { Box, Chip, Grid, Stack, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { DashboardCard } from './dashboard-card';
import { dashboardSectionTitleSx } from './dashboard-styles';
import { toFaDigits } from './to-fa-digits';

const ROWS = [
  { key: 'waitingReview', label: 'در انتظار بررسی', color: 'warning', icon: 'solar:hourglass-line-bold-duotone' },
  {
    key: 'waitingRegistryReply',
    label: 'در انتظار پاسخ ثبت',
    color: 'info',
    icon: 'solar:letter-bold-duotone',
  },
  { key: 'completed', label: 'پایان یافته', color: 'success', icon: 'solar:check-circle-bold-duotone' },
  { key: 'rejected', label: 'ریجکت شده', color: 'error', icon: 'solar:close-circle-bold-duotone' },
];

const SERVICE_ICONS = [
  'solar:document-add-bold-duotone',
  'solar:documents-bold-duotone',
  'solar:folder-with-files-bold-duotone',
];

function serviceTotal(service) {
  return ROWS.reduce((sum, row) => sum + (service[row.key] ?? 0), 0);
}

export function ServiceBreakdownCards({ services, sectionTitle = 'وضعیت خدمات' }) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1" sx={{ ...dashboardSectionTitleSx, px: 0.5 }}>
        {sectionTitle}
      </Typography>
      <Grid container spacing={2}>
        {services.map((service, serviceIndex) => {
          const total = serviceTotal(service);

          return (
            <Grid key={service.name} size={{ xs: 12, md: 4 }}>
              <DashboardCard sx={{ height: '100%' }}>
                <Stack spacing={2} sx={{ p: 2.5 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: (theme) =>
                            varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
                          color: 'primary.main',
                        }}
                      >
                        <Iconify
                          icon={SERVICE_ICONS[serviceIndex % SERVICE_ICONS.length]}
                          width={22}
                        />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {service.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          مجموع: {toFaDigits(total)} درخواست
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                  {ROWS.map((row) => (
                    <Stack
                      key={row.key}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        py: 0.75,
                        px: 1,
                        borderRadius: 1.5,
                        bgcolor: (theme) =>
                          varAlpha(theme.vars.palette[row.color].mainChannel, 0.06),
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Iconify icon={row.icon} width={18} sx={{ color: `${row.color}.main` }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {row.label}
                        </Typography>
                      </Stack>
                      <Chip
                        label={toFaDigits(service[row.key])}
                        color={row.color}
                        size="small"
                        variant="soft"
                        sx={{ fontWeight: 800, minWidth: 48 }}
                      />
                    </Stack>
                  ))}
                </Stack>
              </DashboardCard>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}
