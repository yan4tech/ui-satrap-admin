'use client';

import { useMemo } from 'react';

import { getUserPermissionSlugs, userHasAllPermissions, userHasAnyPermission, userHasPermission } from 'src/lib/permissions';

import { useAuthContext } from 'src/auth/hooks';

export function usePermissions() {
  const { user } = useAuthContext();

  return useMemo(
    () => ({
      user,
      slugs: getUserPermissionSlugs(user),
      can: (slug) => userHasPermission(user, slug),
      canAny: (slugs) => userHasAnyPermission(user, slugs),
      canAll: (slugs) => userHasAllPermissions(user, slugs),
    }),
    [user]
  );
}
