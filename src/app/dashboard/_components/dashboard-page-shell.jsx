'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import { Iconify } from 'src/components/iconify';

export function DashboardPageShell({ title, subtitle, actionLabel, children }) {
  return (
    <Box
      sx={{
        bgcolor: 'common.white',
        minHeight: '100%',
        p: { xs: 2, md: 3 },
      }}
    >
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h4">{title}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {subtitle}
            </Typography>
          </Box>
          {actionLabel ? (
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:download-minimalistic-bold-duotone" />}
            >
              {actionLabel}
            </Button>
          ) : null}
        </Stack>
        {children}
      </Stack>
    </Box>
  );
}
