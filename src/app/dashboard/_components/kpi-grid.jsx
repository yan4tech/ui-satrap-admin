import { Avatar, Box, Card, Grid, Stack, Typography } from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { toFaDigits } from './to-fa-digits';

export function KpiGrid({ items }) {
  return (
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid key={item.title} size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={2} sx={{ p: 2.5 }} alignItems="center">
              <Avatar
                variant="rounded"
                sx={{
                  bgcolor: item.avatarBg ?? 'primary.lighter',
                  color: item.avatarColor ?? 'primary.main',
                  width: 52,
                  height: 52,
                }}
              >
                <Iconify icon={item.icon} width={26} />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {item.title}
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    lineHeight: 1.1,
                    letterSpacing: '0.02em',
                    color: 'text.primary',
                  }}
                >
                  {toFaDigits(item.value)}
                </Typography>
                {item.change ? (
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: item.trend === 'up' ? 'success.main' : 'error.main',
                    }}
                  >
                    {toFaDigits(item.change)}
                  </Typography>
                ) : null}
              </Box>
            </Stack>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
