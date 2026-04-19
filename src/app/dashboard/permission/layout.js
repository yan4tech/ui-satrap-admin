import { Suspense } from 'react';

import { ManagementBread } from '../management-bread';

export default function PermissionLayout({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <ManagementBread section="permission" />
      </Suspense>
      {children}
    </>
  );
}
