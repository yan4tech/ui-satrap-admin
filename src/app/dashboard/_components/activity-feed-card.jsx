import {
  Box,
  List,
  Avatar,
  Divider,
  ListItem,
  Typography,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { DashboardCard } from './dashboard-card';
import { dashboardSectionTitleSx } from './dashboard-styles';

const DEFAULT_ICONS = [
  'solar:user-plus-bold-duotone',
  'solar:refresh-circle-bold-duotone',
  'solar:shield-keyhole-bold-duotone',
  'solar:document-text-bold-duotone',
];

export function ActivityFeedCard({
  title,
  activities = [],
  iconKeys,
  emptyMessage = 'فعالیتی برای نمایش وجود ندارد',
}) {
  return (
    <DashboardCard>
      <Typography variant="h6" sx={{ ...dashboardSectionTitleSx, px: 2.5, pt: 2.5, pb: 1 }}>
        {title}
      </Typography>
      {!activities.length ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', px: 2.5, pb: 2.5 }}>
          {emptyMessage}
        </Typography>
      ) : null}
      <List sx={{ py: 0 }}>
        {activities.map((activity, index) => {
          const icon = activity.icon ?? iconKeys?.[index] ?? DEFAULT_ICONS[index % DEFAULT_ICONS.length];

          return (
            <Box key={activity.title}>
              <ListItem sx={{ py: 1.5, px: 2.5 }}>
                <ListItemAvatar sx={{ minWidth: 48 }}>
                  <Avatar
                    variant="rounded"
                    sx={{ width: 40, height: 40, bgcolor: 'grey.100', color: 'primary.main' }}
                  >
                    <Iconify icon={icon} width={22} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={activity.title}
                  secondary={activity.subtitle}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  secondaryTypographyProps={{ sx: { mt: 0.35, color: 'text.secondary' } }}
                />
              </ListItem>
              {index < activities.length - 1 ? <Divider component="li" sx={{ mx: 2.5 }} /> : null}
            </Box>
          );
        })}
      </List>
    </DashboardCard>
  );
}
