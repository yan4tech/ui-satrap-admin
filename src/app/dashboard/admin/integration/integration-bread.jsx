'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Card, Breadcrumbs, Link, Typography } from '@mui/material';
import { Icon } from '@iconify/react';

import { paths } from 'src/routes/paths';

export function IntegrationBread() {
  const router = useRouter();
  const pathname = usePathname();

  const crumbs = useMemo(() => {
    const list = [{ key: 'home', label: null, onClick: () => router.push(paths.dashboard.root) }];

    list.push({
      key: 'integration',
      label: 'یکپارچه‌سازی',
      onClick: () => router.push(paths.dashboard.admin.integration.connectors),
    });

    if (pathname.includes('/connectors/') && pathname.includes('/actions')) {
      list.push({
        key: 'connectors',
        label: 'کاتالوگ کانکتور',
        onClick: () => router.push(paths.dashboard.admin.integration.connectors),
      });
      list.push({ key: 'actions', label: 'اکشن‌ها', onClick: null, isText: true });
    } else if (pathname.includes('/processes/') && pathname.includes('/integrations')) {
      list.push({
        key: 'connectors',
        label: 'کاتالوگ کانکتور',
        onClick: () => router.push(paths.dashboard.admin.integration.connectors),
      });
      list.push({ key: 'process-binding', label: 'Process Binding', onClick: null, isText: true });
    } else if (pathname.includes('/executions')) {
      list.push({
        key: 'connectors',
        label: 'کاتالوگ کانکتور',
        onClick: () => router.push(paths.dashboard.admin.integration.connectors),
      });
      list.push({ key: 'executions', label: 'مانیتور اجرا', onClick: null, isText: true });
    } else if (pathname.includes('/dlq')) {
      list.push({
        key: 'connectors',
        label: 'کاتالوگ کانکتور',
        onClick: () => router.push(paths.dashboard.admin.integration.connectors),
      });
      list.push({ key: 'dlq', label: 'مدیریت DLQ', onClick: null, isText: true });
    } else if (pathname.includes('/webhooks')) {
      list.push({
        key: 'connectors',
        label: 'کاتالوگ کانکتور',
        onClick: () => router.push(paths.dashboard.admin.integration.connectors),
      });
      list.push({ key: 'webhooks', label: 'مدیریت Webhook', onClick: null, isText: true });
    } else if (pathname.includes('/credential-refs')) {
      list.push({
        key: 'connectors',
        label: 'کاتالوگ کانکتور',
        onClick: () => router.push(paths.dashboard.admin.integration.connectors),
      });
      list.push({ key: 'credential-refs', label: 'Credential Refs', onClick: null, isText: true });
    } else if (pathname.includes('/connectors')) {
      list.push({ key: 'connectors', label: 'کاتالوگ کانکتور', onClick: null, isText: true });
    }

    return list;
  }, [pathname, router]);

  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <Breadcrumbs aria-label="breadcrumb">
        {crumbs.map((c) => {
          if (c.key === 'home') {
            return (
              <Link
                key={c.key}
                component="button"
                type="button"
                underline="hover"
                color="inherit"
                onClick={c.onClick}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
              >
                <Icon icon="mdi:home-outline" width="18" height="18" />
              </Link>
            );
          }
          if (c.isText || !c.onClick) {
            return (
              <Typography key={c.key} color="text.primary" variant="body2">
                {c.label}
              </Typography>
            );
          }
          return (
            <Link
              key={c.key}
              component="button"
              type="button"
              underline="hover"
              color="inherit"
              onClick={c.onClick}
              sx={{ cursor: 'pointer' }}
            >
              {c.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Card>
  );
}
