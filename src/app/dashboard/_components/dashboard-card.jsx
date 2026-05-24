'use client';

import { Card } from '@mui/material';

import { dashboardCardSx, dashboardCardStaticSx } from './dashboard-styles';

export function DashboardCard({ children, hover = true, sx, ...other }) {
  return (
    <Card
      sx={[
        hover ? dashboardCardSx : dashboardCardStaticSx,
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
      {...other}
    >
      {children}
    </Card>
  );
}
