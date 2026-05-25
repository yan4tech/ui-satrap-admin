'use client';

import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

import { fToNow } from 'src/utils/format-time';
import { markNotificationRead } from 'src/lib/notifications-api';
import { resolveNotificationHref } from 'src/lib/notification-navigation';

import { processNotificationIcons } from './icons-process';

// ----------------------------------------------------------------------

const TYPE_COLOR = {
  task: 'info.main',
  correction: 'warning.main',
  lock: 'error.main',
  integration: 'success.main',
};

function renderIcon(type) {
  return processNotificationIcons[type] ?? processNotificationIcons.task;
}

export function NotificationItem({ notification, onRead, onCloseDrawer }) {
  const router = useRouter();

  const handleAction = async () => {
    const wasUnread = notification?.isUnRead !== false;

    if (wasUnread) {
      onRead?.(notification);
      if (notification?.id != null) {
        void markNotificationRead(notification.id).catch(() => {});
      }
    }

    onCloseDrawer?.();
    router.push(resolveNotificationHref(notification));
  };

  const renderAvatar = () => (
    <Box
      sx={{
        width: 40,
        height: 40,
        flexShrink: 0,
        display: 'flex',
        borderRadius: '50%',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.neutral',
        color: TYPE_COLOR[notification.type] || 'text.secondary',
      }}
    >
      <SvgIcon sx={{ width: 24, height: 24 }}>{renderIcon(notification.type)}</SvgIcon>
    </Box>
  );

  const renderText = () => (
    <ListItemText
      primary={
        <Typography variant="subtitle2" component="span">
          {notification.title}
        </Typography>
      }
      secondary={
        <>
          {notification.category}
          <Box
            component="span"
            sx={{ width: 2, height: 2, borderRadius: '50%', bgcolor: 'currentColor', mx: 0.5 }}
          />
          {fToNow(notification.createdAt)}
        </>
      }
      slotProps={{
        primary: { sx: { mb: 0.5 } },
        secondary: {
          sx: {
            gap: 0.5,
            display: 'flex',
            alignItems: 'center',
            typography: 'caption',
            color: 'text.disabled',
          },
        },
      }}
    />
  );

  const renderUnReadBadge = () =>
    notification.isUnRead && (
      <Box
        sx={{
          top: 26,
          width: 8,
          height: 8,
          left: 10,
          borderRadius: '50%',
          bgcolor: 'info.main',
          position: 'absolute',
        }}
      />
    );

  return (
    <ListItemButton
      disableRipple
      onClick={handleAction}
      sx={[
        (theme) => ({
          p: 2.5,
          alignItems: 'flex-start',
          gap: 1.5,
          opacity: notification.isUnRead ? 1 : 0.72,
          borderBottom: `dashed 1px ${theme.vars.palette.divider}`,
        }),
      ]}
    >
      {renderUnReadBadge()}
      {renderAvatar()}

      <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
        {renderText()}
        {notification.body ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.75, whiteSpace: 'pre-line' }}
          >
            {notification.body}
          </Typography>
        ) : null}

        {notification.actionLabel ? (
          <Button
            size="small"
            variant="contained"
            sx={{ mt: 1.5 }}
            onClick={(e) => {
              e.stopPropagation();
              handleAction();
            }}
          >
            {notification.actionLabel}
          </Button>
        ) : null}
      </Box>
    </ListItemButton>
  );
}
