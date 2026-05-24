import { Avatar, Box, Divider, List, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { DashboardCard } from './dashboard-card';
import { dashboardSectionTitleSx } from './dashboard-styles';

export function TimelineCard({ title, entries }) {
  return (
    <DashboardCard sx={{ height: '100%' }}>
      <Typography variant="h6" sx={{ ...dashboardSectionTitleSx, px: 2.5, pt: 2.5, pb: 1 }}>
        {title}
      </Typography>
      <List sx={{ py: 0 }}>
        {entries.map((entry, index) => (
          <Box key={entry.title}>
            <ListItem sx={{ py: 1.25, px: 2.5 }}>
              <ListItemAvatar sx={{ minWidth: 48 }}>
                <Avatar
                  variant="rounded"
                  sx={{ width: 40, height: 40, bgcolor: 'info.lighter', color: 'info.main' }}
                >
                  <Iconify icon={entry.icon} width={22} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={entry.title}
                secondary={entry.subtitle}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                secondaryTypographyProps={{ sx: { mt: 0.35 } }}
              />
            </ListItem>
            {index < entries.length - 1 ? <Divider component="li" variant="inset" sx={{ mr: 2.5 }} /> : null}
          </Box>
        ))}
      </List>
    </DashboardCard>
  );
}
