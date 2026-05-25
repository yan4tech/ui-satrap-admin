import { Suspense } from 'react';

import { ManagementBread } from '../management-bread';

export default function AuditLayout({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <ManagementBread section="audit" />
      </Suspense>
      {children}
    </>
  );
}
