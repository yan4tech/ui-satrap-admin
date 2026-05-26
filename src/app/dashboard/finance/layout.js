import { Suspense } from 'react';

import { ManagementBread } from '../management-bread';

export default function FinanceLayout({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <ManagementBread section="finance" />
      </Suspense>
      {children}
    </>
  );
}
