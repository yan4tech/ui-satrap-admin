'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Card, Breadcrumbs, Link, Typography } from '@mui/material';
import { Icon } from '@iconify/react';

import { paths } from 'src/routes/paths';

const SECTIONS = {
  role: {
    listPath: () => paths.dashboard.role.search,
    sectionLabel: 'نقش',
    createLabel: 'نقش جدید',
    listLabel: 'لیست نقش‌ها',
    editLabel: 'ویرایش نقش',
    detailsLabel: 'جزئیات نقش',
  },
  permission: {
    listPath: () => paths.dashboard.permission.search,
    sectionLabel: 'دسترسی',
    createLabel: 'دسترسی جدید',
    listLabel: 'لیست دسترسی‌ها',
    editLabel: 'ویرایش دسترسی',
    detailsLabel: 'جزئیات دسترسی',
  },
  user: {
    listPath: () => paths.dashboard.user.search,
    sectionLabel: 'کاربر',
    createLabel: 'کاربر جدید',
    listLabel: 'لیست کاربران',
    editLabel: 'ویرایش کاربر',
    detailsLabel: 'جزئیات کاربر',
  },
};

/**
 * @param {{ section: 'role' | 'permission' | 'user' }} props
 */
export function ManagementBread({ section }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cfg = SECTIONS[section];

  const crumbs = useMemo(() => {
    const readOnly = searchParams.get('view') === '1';
    /** @type {{ key: string, label: string | null, onClick: (() => void) | null, isText?: boolean }[]} */
    const list = [{ key: 'home', label: null, onClick: () => router.push(paths.dashboard.root) }];

    if (pathname.endsWith('/search')) {
      list.push({ key: 'cur', label: cfg.listLabel, onClick: null, isText: true });
    } else if (pathname.endsWith('/create')) {
      list.push({
        key: 'list',
        label: cfg.listLabel,
        onClick: () => router.push(cfg.listPath()),
      });
      list.push({ key: 'cur', label: cfg.createLabel, onClick: null, isText: true });
    } else if (pathname.includes('/edit/')) {
      list.push({
        key: 'list',
        label: cfg.listLabel,
        onClick: () => router.push(cfg.listPath()),
      });
      list.push({
        key: 'cur',
        label: readOnly ? cfg.detailsLabel : cfg.editLabel,
        onClick: null,
        isText: true,
      });
    }

    return list;
  }, [pathname, searchParams, router, cfg]);

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
