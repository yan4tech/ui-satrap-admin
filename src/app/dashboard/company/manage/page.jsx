'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { paths } from 'src/routes/paths';

export default function CompanyManageRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(paths.dashboard.branch.centralManage);
  }, [router]);
  return null;
}
