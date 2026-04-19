import { Suspense } from 'react';

import { ManagementBread } from '../management-bread';

export default function UserLayout({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <ManagementBread section="user" />
      </Suspense>
      {children}
    </>
  );
}
