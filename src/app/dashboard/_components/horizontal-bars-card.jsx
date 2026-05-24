import { varAlpha } from 'minimal-shared/utils';

import { Box, Stack, Typography } from '@mui/material';

import { DashboardCard } from './dashboard-card';
import { dashboardSectionTitleSx } from './dashboard-styles';
import { toFaDigits } from './to-fa-digits';

export function HorizontalBarsCard({
  title,
  subheader,
  items,
  valueKey = 'value',
  labelKey = 'label',
  colorKey = 'color',
}) {
  const values = items.map((item) => item[valueKey]);
  const max = Math.max(...values, 1);
  const total = values.reduce((sum, v) => sum + v, 0);

  return (
    <DashboardCard sx={{ height: '100%' }}>
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
        <Typography variant="h6" sx={dashboardSectionTitleSx}>
          {title}
        </Typography>
        {subheader ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {subheader}
          </Typography>
        ) : null}
      </Box>
      <Stack spacing={1.5} sx={{ px: 2.5, pb: 2.5 }}>
        {items.map((item) => {
          const value = item[valueKey];
          const widthPct =
            colorKey === 'share' ? (total > 0 ? (value / total) * 100 : 0) : (value / max) * 100;

          return (
            <Box key={item[labelKey]}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {item[labelKey]}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800 }}>
                  {toFaDigits(value)}
                </Typography>
              </Stack>
              <Box
                sx={{
                  bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.12),
                  borderRadius: 99,
                  height: 10,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: 1,
                    borderRadius: 99,
                    bgcolor: item[colorKey] ?? 'primary.main',
                    width: `${widthPct}%`,
                    minWidth: value > 0 ? 8 : 0,
                    transition: (theme) =>
                      theme.transitions.create('width', { duration: theme.transitions.duration.standard }),
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Stack>
    </DashboardCard>
  );
}
