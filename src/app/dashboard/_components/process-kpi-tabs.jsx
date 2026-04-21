'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  Chip,
  Tab,
  Tabs,
  Grid,
  Stack,
  Typography,
  CardHeader,
} from '@mui/material';

const toFaDigits = (value) =>
  String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

export function ProcessKpiTabs({ data }) {
  const [activeProvince, setActiveProvince] = useState(data?.[0]?.province ?? '');

  const currentProvince = data.find((item) => item.province === activeProvince) ?? data[0];

  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
      <CardHeader title="تعداد خدمات به تفکیک استان" />

      <Tabs
        value={activeProvince}
        onChange={(_, value) => setActiveProvince(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {data.map((item) => (
          <Tab key={item.province} value={item.province} label={`استان ${item.province}`} />
        ))}
      </Tabs>

      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Grid container spacing={2}>
          {currentProvince.services.map((service) => (
            <Grid key={`${currentProvince.province}-${service.name}`} size={{ xs: 12, md: 4 }}>
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
