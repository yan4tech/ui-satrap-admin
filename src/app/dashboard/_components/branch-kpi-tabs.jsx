'use client';

import { useState } from 'react';

import {
  Box,
  Tab,
  Card,
  Chip,
  Tabs,
  Grid,
  Stack,
  Typography,
  CardHeader,
} from '@mui/material';

import { toFaDigits } from './to-fa-digits';

export function BranchKpiTabs({ data, title = 'عملکرد شعب به تفکیک خدمت' }) {
  const [activeBranch, setActiveBranch] = useState(data?.[0]?.branch ?? '');
  const current = data.find((item) => item.branch === activeBranch) ?? data[0];

  if (!current) return null;

  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
      <CardHeader title={title} />
      <Tabs
        value={activeBranch}
        onChange={(_, value) => setActiveBranch(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {data.map((item) => (
          <Tab key={item.branch} value={item.branch} label={item.branch} />
        ))}
      </Tabs>
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Grid container spacing={2}>
          {current.services.map((service) => (
            <Grid key={`${current.branch}-${service.name}`} size={{ xs: 12, md: 4 }}>
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  {service.name}
                </Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    موفق
                  </Typography>
                  <Chip label={toFaDigits(service.success)} color="success" sx={{ fontWeight: 700 }} />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    ناموفق
                  </Typography>
                  <Chip label={toFaDigits(service.failed)} color="error" sx={{ fontWeight: 700 }} />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    در دست بررسی
                  </Typography>
                  <Chip label={toFaDigits(service.inReview)} color="warning" sx={{ fontWeight: 700 }} />
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Card>
  );
}
