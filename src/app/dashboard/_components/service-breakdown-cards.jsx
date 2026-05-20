import { Card, Chip, Grid, Stack, Typography } from '@mui/material';
import { toFaDigits } from './to-fa-digits';

const ROWS = [
  { key: 'waitingReview', label: 'در انتظار بررسی', color: 'warning' },
  { key: 'waitingRegistryReply', label: 'در انتظار پاسخ سازمان ثبت', color: 'info' },
  { key: 'completed', label: 'پایان یافته', color: 'success' },
  { key: 'rejected', label: 'ریجکت شده', color: 'error' },
];

export function ServiceBreakdownCards({ services }) {
  return (
    <Grid container spacing={2}>
      {services.map((service) => (
        <Grid key={service.name} size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Stack spacing={1.5} sx={{ p: 2.5 }}>
              <Typography variant="h6">{service.name}</Typography>
              {ROWS.map((row) => (
                <Stack key={row.key} direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {row.label}
                  </Typography>
                  <Chip
                    label={toFaDigits(service[row.key])}
                    color={row.color}
                    sx={{ fontWeight: 800, minWidth: 56 }}
                  />
                </Stack>
              ))}
            </Stack>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
