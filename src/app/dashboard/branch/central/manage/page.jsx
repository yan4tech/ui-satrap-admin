'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { tenantCentralBranchPath } from 'src/lib/dashboard-access';

import { useAuthContext } from 'src/auth/hooks';

/** مسیر قدیمی — هدایت به ویرایش شعبه مرکزی در مدیریت شعبات */
export default function CentralBranchManageRedirectPage() {
  const router = useRouter();
  const { user } = useAuthContext();

  useEffect(() => {
    router.replace(tenantCentralBranchPath(user));
  }, [router, user]);

  return null;
}
