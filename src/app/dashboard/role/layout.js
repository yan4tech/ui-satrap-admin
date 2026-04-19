import { Suspense } from 'react';

import { ManagementBread } from '../management-bread';

export default function RoleLayout({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <ManagementBread section="role" />
      </Suspense>
      {children}
    </>
  );
}
