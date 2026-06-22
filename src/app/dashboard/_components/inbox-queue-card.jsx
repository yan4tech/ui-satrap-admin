import { Box, Button, Chip, Divider, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { ServiceLabel } from 'src/components/service-label';

import { DashboardCard } from './dashboard-card';
import { dashboardSectionTitleSx } from './dashboard-styles';

const priorityColor = { high: 'error', medium: 'warning', low: 'default' };
const priorityLabel = { high: 'فوری', medium: 'متوسط', low: 'عادی' };

export function InboxQueueCard({
  title,
  subheader,
  items,
  showAction = false,
  actionLabel = 'مشاهده همه',
  onAction,
}) {
  return (
    <DashboardCard sx={{ height: '100%' }}>
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        sx={{ px: 2.5, pt: 2.5, pb: 1 }}
      >
        <Box>
          <Typography variant="h6" sx={dashboardSectionTitleSx}>
            {title}
          </Typography>
          {subheader ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {subheader}
            </Typography>
          ) : null}
        </Box>
        {showAction ? (
          <Button
            size="small"
            color="inherit"
            endIcon={<Iconify icon="solar:alt-arrow-left-linear" width={18} />}
            onClick={onAction}
            sx={{ flexShrink: 0 }}
          >
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
      <List sx={{ py: 0 }}>
        {items.map((item, index) => (
          <Box key={item.id}>
            <ListItem
              sx={{
                py: 1.75,
                px: 2.5,
                transition: (theme) => theme.transitions.create('background-color'),
                '&:hover': { bgcolor: 'action.hover' },
              }}
              secondaryAction={
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Chip size="small" label={item.wait} variant="outlined" />
                  {item.priority ? (
                    <Chip
                      size="small"
                      label={priorityLabel[item.priority]}
                      color={priorityColor[item.priority]}
                    />
                  ) : null}
                </Stack>
              }
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography component="span" variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                      {item.id}
                    </Typography>
                    <ServiceLabel
                      label={item.service}
                      variant="table"
                      component="span"
                      sx={{ color: 'text.secondary' }}
                    />
                  </Stack>
                }
                secondary={
                  item.step
                    ? `متقاضی: ${item.applicant} · مرحله: ${item.step}`
                    : `متقاضی: ${item.applicant}`
                }
                secondaryTypographyProps={{ sx: { mt: 0.5, color: 'text.secondary' } }}
              />
            </ListItem>
            {index < items.length - 1 ? <Divider component="li" sx={{ mx: 2.5 }} /> : null}
          </Box>
        ))}
      </List>
    </DashboardCard>
  );
}
