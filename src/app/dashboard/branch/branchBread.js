'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Breadcrumbs, Link, Typography } from '@mui/material';
import { Icon } from '@iconify/react';

const BranchBread = () => {
  const router = useRouter();

  return (
    <Card sx={{ p: 2 }}>
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
          onClick={() => router.push('/main/branch/search')}
        >
          <Icon icon="mdi:account-outline" width="18" height="18" />
          لیست شعبات
        </Link>

        {/* Current page */}
        <Typography color="text.primary">شعبه جدید</Typography>
      </Breadcrumbs>
    </Card>
  );
};

export default BranchBread;
