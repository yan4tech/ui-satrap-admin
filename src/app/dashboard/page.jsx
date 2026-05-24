import { CONFIG } from 'src/global-config';

import { CentralDashboardView } from './central-dashboard-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <CentralDashboardView />;
}
