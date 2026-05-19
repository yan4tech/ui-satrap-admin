import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { AuthGuard } from 'src/auth/guard';
import { DashboardScopeGuard } from 'src/auth/guard/dashboard-scope-guard';

// ----------------------------------------------------------------------

export default function Layout({ children }) {
  if (CONFIG.auth.skip) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return (
    <AuthGuard>
      <DashboardScopeGuard>
        <DashboardLayout>{children}</DashboardLayout>
      </DashboardScopeGuard>
    </AuthGuard>
  );
}
