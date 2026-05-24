import { Avatar, Box, Chip, Divider, List, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material';

import { DashboardCard } from './dashboard-card';
import { dashboardSectionTitleSx } from './dashboard-styles';

export function TeamListCard({ title, members }) {
  return (
    <DashboardCard sx={{ height: '100%' }}>
      <Typography variant="h6" sx={{ ...dashboardSectionTitleSx, px: 2.5, pt: 2.5, pb: 1 }}>
        {title}
      </Typography>
      <List sx={{ py: 0 }}>
        {members.map((member, index) => (
          <Box key={member.name}>
            <ListItem sx={{ py: 1.25, px: 2.5 }}>
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: 'primary.lighter',
                    color: 'primary.dark',
                    fontWeight: 700,
                  }}
                >
                  {member.name.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={member.name}
                secondary={member.role}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
              />
              <Chip
                label={member.status}
                color={member.color}
                size="small"
                variant="soft"
                sx={{
                  '& .MuiChip-label': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                  },
                }}
              />
            </ListItem>
            {index < members.length - 1 ? <Divider component="li" variant="inset" sx={{ mr: 2.5 }} /> : null}
          </Box>
        ))}
      </List>
    </DashboardCard>
  );
}
