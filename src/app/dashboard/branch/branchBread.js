'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Card, Breadcrumbs, Link, Typography, Button } from '@mui/material';
import { Icon } from '@iconify/react';

const BranchBread = () => {
  const router = useRouter();
  const pathname = usePathname();

  const getCurrentPageLabel = () => {
    if (pathname?.includes('/dashboard/branch/create')) return 'شعبه جدید';
    if (pathname?.includes('/dashboard/branch/edit/')) return 'ویرایش شعبه';
    return 'لیست شعبات';
  };

  const currentPageLabel = getCurrentPageLabel();
  const isSearchPage = pathname?.includes('/dashboard/branch/search');

  return (
    <Card sx={{ p: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Breadcrumbs aria-label="breadcrumb">
          {/* Home */}
          <Link
            underline="hover"
            color="inherit"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
            }}
            onClick={() => router.push('/main/dashboard/crm')}
          >
            <Icon icon="mdi:home-outline" width="18" height="18" />
          </Link>

          {/* Branch list */}
          <Link
            underline="hover"
            color="inherit"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
            }}
            onClick={() => router.push('/dashboard/branch/search')}
          >
            <Icon icon="mdi:account-outline" width="18" height="18" />
            لیست شعبات
          </Link>

          {!isSearchPage && <Typography color="text.primary">{currentPageLabel}</Typography>}
        </Breadcrumbs>

        {isSearchPage && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Icon icon="mdi:plus" width="18" />}
            onClick={() => router.push('/dashboard/branch/create')}
          >
            شعبه جدید
          </Button>
        )}
      </div>
    </Card>
  );
};

export default BranchBread;
