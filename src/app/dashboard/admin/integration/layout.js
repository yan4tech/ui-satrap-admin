import { Suspense } from 'react';

import { IntegrationToastProvider } from 'src/components/integration-toast/integration-toast-provider';

import { IntegrationBread } from './integration-bread';

export default function IntegrationAdminLayout({ children }) {
  return (
    <IntegrationToastProvider>
      <Suspense fallback={null}>
        <IntegrationBread />
      </Suspense>
      <Suspense fallback={null}>{children}</Suspense>
    </IntegrationToastProvider>
  );
}
