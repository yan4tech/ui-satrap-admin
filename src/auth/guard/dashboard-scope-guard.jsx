'use client';

import { useEffect, useState } from 'react';

import { useRouter, usePathname } from 'src/routes/hooks';

import { SplashScreen } from 'src/components/loading-screen';

import { getDashboardAccessRedirect } from 'src/lib/dashboard-access';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

export function DashboardScopeGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    const redirect = getDashboardAccessRedirect(pathname, user);
    if (redirect && redirect !== pathname) {
      router.replace(redirect);
      return;
    }

    setReady(true);
  }, [loading, pathname, router, user]);

  if (loading || !ready) {
    return <SplashScreen />;
  }

  return children;
}
