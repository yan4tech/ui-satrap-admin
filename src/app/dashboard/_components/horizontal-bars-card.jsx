import { Box, Card, CardHeader, Stack, Typography } from '@mui/material';
import { toFaDigits } from './to-fa-digits';

export function HorizontalBarsCard({ title, items, valueKey = 'value', labelKey = 'label', colorKey = 'color' }) {
  const values = items.map((item) => item[valueKey]);
  const max = Math.max(...values, 1);
  const total = values.reduce((sum, v) => sum + v, 0);

  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <CardHeader title={title} />
      <Stack spacing={1.25} sx={{ px: 2.5, pb: 2.5 }}>
        {items.map((item) => {
          const value = item[valueKey];
          const widthPct = colorKey === 'share'
            ? total > 0 ? (value / total) * 100 : 0
            : (value / max) * 100;

          return (
            <Box key={item[labelKey]}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {item[labelKey]}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {toFaDigits(value)}
                </Typography>
              </Stack>
              <Box sx={{ bgcolor: 'grey.200', borderRadius: 99, height: 8 }}>
                <Box
                  sx={{
                    height: 1,
                    borderRadius: 99,
                    bgcolor: item[colorKey] ?? 'primary.main',
                    width: `${widthPct}%`,
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}
