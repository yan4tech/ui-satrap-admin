'use client';

import { Alert, Button } from '@mui/material';

import { Iconify } from 'src/components/iconify';

/**
 * Shared fetch-state wrapper for dashboard pages — error + retry, then content.
 * Loading skeletons: render page-specific layouts via `dashboard-section-skeleton.jsx`.
 *
 * @param {{
 *   error?: string | null,
 *   onRetry?: () => void,
 *   children?: import('react').ReactNode,
 * }} props
 */
export function DashboardFetchState({ error, onRetry, children }) {
  if (error) {
    return (
      <Alert
        severity="error"
        sx={{ mb: 2 }}
        action={
          onRetry ? (
            <Button
              color="inherit"
              size="small"
              onClick={onRetry}
              startIcon={<Iconify icon="solar:refresh-bold" width={18} />}
            >
              تلاش مجدد
            </Button>
          ) : null
        }
      >
        {error}
      </Alert>
    );
  }

  return children;
}
