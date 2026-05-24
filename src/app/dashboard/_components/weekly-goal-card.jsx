import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';

import { DashboardCard } from './dashboard-card';
import { dashboardSectionTitleSx } from './dashboard-styles';
import { toFaDigits } from './to-fa-digits';

export function WeeklyGoalCard({ title, subheader, progress, description, actions }) {
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
      <Stack spacing={2} sx={{ px: 2.5, pb: 2.5 }}>
        <Box sx={{ position: 'relative' }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            color="info"
            sx={{ height: 10, borderRadius: 99 }}
          />
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: progress > 45 ? 'common.white' : 'text.primary',
            }}
          >
            {toFaDigits(progress)}٪
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
          {description}
        </Typography>
        {actions?.length > 0 ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {actions.map((action, index) => (
              <Button
                key={action.key ?? action.href ?? action.label ?? action.children ?? index}
                {...action}
                size="small"
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </DashboardCard>
  );
}
