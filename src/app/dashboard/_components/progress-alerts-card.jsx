import { Box, Stack, Typography, LinearProgress } from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { toFaDigits } from './to-fa-digits';
import { DashboardCard } from './dashboard-card';
import { dashboardSectionTitleSx } from './dashboard-styles';

export function ProgressAlertsCard({
  title,
  subheader,
  tasks = [],
  emptyMessage = 'هشداری برای نمایش وجود ندارد',
}) {
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
      {!tasks.length ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', px: 2.5, pb: 2.5 }}>
          {emptyMessage}
        </Typography>
      ) : null}
      <Stack spacing={2.25} sx={{ px: 2.5, pb: 2.5 }}>
        {tasks.map((task) => (
          <Box key={task.label}>
            <Stack direction="row" alignItems="flex-start" spacing={1.5}>
              <Box
                sx={{
                  mt: 0.25,
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: task.progress >= 70 ? 'error.lighter' : 'warning.lighter',
                  color: task.progress >= 70 ? 'error.main' : 'warning.main',
                  flexShrink: 0,
                }}
              >
                <Iconify
                  icon={
                    task.progress >= 70
                      ? 'solar:danger-triangle-bold-duotone'
                      : 'solar:clock-circle-bold-duotone'
                  }
                  width={18}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {task.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    {toFaDigits(task.progress)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={task.progress}
                  color={task.progress >= 70 ? 'error' : 'warning'}
                  sx={{ height: 8, borderRadius: 99 }}
                />
              </Box>
            </Stack>
          </Box>
        ))}
      </Stack>
    </DashboardCard>
  );
}
