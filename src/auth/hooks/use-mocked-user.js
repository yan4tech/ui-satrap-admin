'use client';

import { useAuthContext } from './use-auth-context';

/**
 * قبلاً کاربر ماک برمی‌گرداند؛ اکنون همان `useAuthContext` است (کاربر از `/api/membership/user/me`).
 * @deprecated از `useAuthContext` استفاده کنید.
 */
export function useMockedUser() {
  return useAuthContext();
}
