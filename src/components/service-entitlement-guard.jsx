'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { Box, Alert, Button, CircularProgress, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useAuthContext } from 'src/auth/hooks';
import { useEntitledServices } from 'src/hooks/use-entitled-services';
import { canAccessServiceProcess } from 'src/lib/service-entitlement-api';

/**
 * در حالت شعبه، دسترسی به صفحهٔ یک خدمت را بر اساس process_key محدود می‌کند.
 */
export function ServiceEntitlementGuard({ processKey, children }) {
  const router = useRouter();
  const { user } = useAuthContext();
  const { isBranchEntitlementActive, hasProcessKey, loading, error, services } =
    useEntitledServices();
  const canAccess = useMemo(
    () => canAccessServiceProcess(user, processKey, hasProcessKey),
    [user, processKey, hasProcessKey]
  );

  useEffect(() => {
    if (loading || !isBranchEntitlementActive) return;
    if (!canAccess) {
      router.replace(paths.dashboard.services.inbox);
    }
  }, [loading, isBranchEntitlementActive, canAccess, router]);

  if (!isBranchEntitlementActive) {
    return children;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!canAccess) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          این خدمت برای شعبهٔ شما فعال نیست
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          خدمات مجاز:{' '}
          {services.length > 0 ? services.map((s) => s.title).join('، ') : 'هیچ خدمتی تخصیص داده نشده'}
        </Typography>
        <Button variant="contained" onClick={() => router.push(paths.dashboard.services.inbox)}>
          بازگشت به صندوق کار
        </Button>
      </Box>
    );
  }

  return children;
}
