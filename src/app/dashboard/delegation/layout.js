'use client';

import { ManagementBread } from '../management-bread';

export default function DelegationLayout({ children }) {
  return (
    <>
      <ManagementBread section="delegation" />
      {children}
    </>
  );
}
