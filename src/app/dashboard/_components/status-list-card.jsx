import { Box, Chip, List, Stack, Button, Divider, ListItem, Typography, ListItemText } from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { ServiceLabel } from 'src/components/service-label';

import { DashboardCard } from './dashboard-card';
import { dashboardSectionTitleSx } from './dashboard-styles';

const STATE_ICONS = {
  success: 'solar:check-circle-bold-duotone',
  warning: 'solar:danger-circle-bold-duotone',
  error: 'solar:close-circle-bold-duotone',
  default: 'solar:minus-circle-bold-duotone',
};

export function StatusListCard({
  title,
  items = [],
  footerActions,
  emptyMessage = 'وضعیت خدماتی برای نمایش وجود ندارد',
}) {
  return (
    <DashboardCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ ...dashboardSectionTitleSx, px: 2.5, pt: 2.5, pb: 1 }}>
        {title}
      </Typography>
      {!items.length ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', px: 2.5, pb: 1.5, flex: 1 }}>
          {emptyMessage}
        </Typography>
      ) : null}
      <List sx={{ py: 0, flex: 1 }}>
        {items.map((service, index) => (
          <Box key={service.name}>
            <ListItem
              sx={{ py: 1.25, px: 2.5 }}
              secondaryAction={
                <Chip
                  label={service.state}
                  color={service.color}
                  size="small"
                  icon={
                    <Iconify
                      icon={STATE_ICONS[service.color] ?? STATE_ICONS.default}
                      width={16}
                    />
                  }
                />
              }
            >
              <ListItemText
                primary={<ServiceLabel label={service.name} variant="default" sx={{ fontWeight: 600 }} />}
              />
            </ListItem>
            {index < items.length - 1 ? <Divider component="li" sx={{ mx: 2.5 }} /> : null}
          </Box>
        ))}
      </List>
      {footerActions?.length > 0 ? (
        <>
          <Divider />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ p: 2 }}>
            {footerActions.map((action, index) => (
              <Button
                key={action.key ?? action.href ?? action.label ?? action.children ?? index}
                {...action}
                size="small"
              />
            ))}
          </Stack>
        </>
      ) : null}
    </DashboardCard>
  );
}
