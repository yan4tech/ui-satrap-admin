'use client';

import { m } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { varTap, varHover, transitionTap } from 'src/components/animate';
import {
  fetchNotifications,
  markAllNotificationsRead,
  subscribeNotificationStream,
  notificationLogicalKey,
  persistNotificationRead,
  countUnreadNotifications,
  countReadNotifications,
  mergeNotificationsWithReadState,
} from 'src/lib/notifications-api';

import { NotificationItem } from './notification-item';

// ----------------------------------------------------------------------

function filterByTab(items, tab) {
  if (tab === 'unread') return items.filter((n) => n.isUnRead && !n.isArchived);
  if (tab === 'read') return items.filter((n) => !n.isUnRead && !n.isArchived);
  if (tab === 'archived') return items.filter((n) => n.isArchived);
  return items.filter((n) => !n.isArchived);
}

function itemRowKey(notification) {
  return notificationLogicalKey(notification) || String(notification.id);
}

// ----------------------------------------------------------------------

export function NotificationsDrawer({ sx, ...other }) {
  const router = useRouter();
  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  const [currentTab, setCurrentTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({ all: 0, unread: 0, read: 0, archived: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const notificationsRef = useRef([]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const syncCounts = useCallback((items) => {
    setCounts({
      all: items.filter((n) => !n.isArchived).length,
      unread: countUnreadNotifications(items),
      read: countReadNotifications(items),
      archived: items.filter((n) => n.isArchived).length,
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchNotifications('all');
      const merged = mergeNotificationsWithReadState(page.items, notificationsRef.current);
      setNotifications(merged);
      syncCounts(merged);
    } catch (e) {
      setError(e?.message || 'بارگذاری اعلان‌ها ناموفق بود');
    } finally {
      setLoading(false);
    }
  }, [syncCounts]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    const unsub = subscribeNotificationStream((dto) => {
      setNotifications((prev) => {
        const lk = notificationLogicalKey(dto);
        const exists = prev.some(
          (n) => String(n.id) === String(dto.id) || (lk && notificationLogicalKey(n) === lk)
        );
        if (exists) return prev;
        const next = mergeNotificationsWithReadState([dto, ...prev], prev);
        syncCounts(next);
        return next;
      });
    });
    pollRef.current = setInterval(() => {
      if (open) void load();
    }, 30_000);
    return () => {
      unsub();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load, open, syncCounts]);

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const tabs = useMemo(
    () => [
      { value: 'all', label: 'همه', count: counts.all },
      { value: 'unread', label: 'خوانده‌نشده', count: counts.unread },
      { value: 'read', label: 'خوانده‌شده', count: counts.read },
      { value: 'archived', label: 'بایگانی', count: counts.archived },
    ],
    [counts]
  );

  const visible = useMemo(
    () => filterByTab(notifications, currentTab),
    [notifications, currentTab]
  );

  const totalUnRead = counts.unread;

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => {
      prev.forEach((n) => persistNotificationRead(n));
      const next = prev.map((n) => ({ ...n, isUnRead: false }));
      syncCounts(next);
      return next;
    });
    try {
      await markAllNotificationsRead();
    } catch {
      /* UI already optimistic */
    }
  };

  const handleItemRead = (notification) => {
    if (!notification) return;
    const lk = notificationLogicalKey(notification);
    persistNotificationRead(notification);
    setNotifications((prev) => {
      const next = prev.map((n) => {
        const same =
          String(n.id) === String(notification.id) ||
          (lk && notificationLogicalKey(n) === lk);
        return same ? { ...n, isUnRead: false } : n;
      });
      syncCounts(next);
      return next;
    });
  };

  const renderHead = () => (
    <Box
      sx={{
        py: 2,
        pr: 1,
        pl: 2.5,
        minHeight: 68,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        اعلان‌ها
      </Typography>

      {!!totalUnRead && (
        <Tooltip title="علامت‌گذاری همه به‌عنوان خوانده‌شده">
          <IconButton color="primary" onClick={handleMarkAllAsRead}>
            <Iconify icon="eva:done-all-fill" />
          </IconButton>
        </Tooltip>
      )}

      <IconButton onClick={onClose} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>
    </Box>
  );

  const renderTabs = () => (
    <Tabs
      variant="scrollable"
      scrollButtons="auto"
      value={currentTab}
      onChange={handleChangeTab}
      indicatorColor="custom"
      sx={{ px: 0.5 }}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.value}
          iconPosition="end"
          value={tab.value}
          label={tab.label}
          icon={
            <Label
              variant={tab.value === currentTab ? 'filled' : 'soft'}
              color={
                (tab.value === 'unread' && 'info') ||
                (tab.value === 'read' && 'success') ||
                (tab.value === 'archived' && 'default') ||
                'default'
              }
            >
              {tab.count}
            </Label>
          }
          sx={{ minWidth: 'auto', px: 1.5 }}
        />
      ))}
    </Tabs>
  );

  const renderList = () => {
    if (loading && visible.length === 0) {
      return (
        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      );
    }
    if (error && visible.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
          {error}
        </Typography>
      );
    }
    if (visible.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
          {currentTab === 'unread' && 'اعلان خوانده‌نشده‌ای نیست.'}
          {currentTab === 'read' && 'اعلان خوانده‌شده‌ای نیست.'}
          {currentTab === 'archived' && 'بایگانی خالی است.'}
          {currentTab === 'all' && 'اعلانی برای نمایش وجود ندارد.'}
        </Typography>
      );
    }
    return (
      <Scrollbar>
        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {visible.map((notification) => (
            <Box component="li" key={itemRowKey(notification)} sx={{ display: 'flex' }}>
              <NotificationItem
                notification={notification}
                onRead={handleItemRead}
                onCloseDrawer={onClose}
              />
            </Box>
          ))}
        </Box>
      </Scrollbar>
    );
  };

  return (
    <>
      <IconButton
        component={m.button}
        whileTap={varTap(0.96)}
        whileHover={varHover(1.04)}
        transition={transitionTap()}
        aria-label="Notifications button"
        onClick={onOpen}
        sx={sx}
        {...other}
      >
        <Badge badgeContent={totalUnRead} color="error">
          <Iconify width={24} icon="solar:bell-bing-bold-duotone" />
        </Badge>
      </IconButton>

      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        slotProps={{
          backdrop: { invisible: true },
          paper: { sx: { width: 1, maxWidth: 420 } },
        }}
      >
        {renderHead()}
        {renderTabs()}
        {renderList()}

        <Box sx={{ p: 1 }}>
          <Button fullWidth size="large" onClick={() => router.push(paths.dashboard.services.inbox)}>
            صندوق کار
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
