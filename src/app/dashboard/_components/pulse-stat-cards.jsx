import { Box, Grid, Stack, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { toFaDigits } from './to-fa-digits';
import { DashboardCard } from './dashboard-card';

const ICONS = [
  'solar:inbox-bold-duotone',
  'solar:users-group-two-rounded-bold-duotone',
  'solar:chart-2-bold-duotone',
];

export function PulseStatCards({ items }) {
  return (
    <Grid container spacing={2}>
      {items.map((item, index) => (
        <Grid key={item.label} size={{ xs: 12, sm: 4 }}>
          <DashboardCard sx={{ height: '100%' }}>
            <Stack spacing={1} sx={{ p: 2.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'info.lighter',
                  color: 'info.main',
                }}
              >
                <Iconify icon={item.icon ?? ICONS[index % ICONS.length]} width={22} />
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {item.label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                {toFaDigits(item.value)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {item.hint}
              </Typography>
            </Stack>
          </DashboardCard>
        </Grid>
      ))}
    </Grid>
  );
}
