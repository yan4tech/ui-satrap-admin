'use client';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import axios, { endpoints } from 'src/lib/axios';
import { clearMembershipUserHeader, setMembershipUserJsonFromObject } from 'src/lib/api-user-header';
import { normalizeMembershipUser } from 'src/auth/utils';
import { setApiMode } from 'src/lib/api-mode';
import { getBranchIdStored, setBranchIdForApi } from 'src/lib/api-branch-header';
import { PERM, userHasAnyPermission, userHasPermission } from 'src/lib/permissions';

import { JWT_STORAGE_KEY } from './constant';
import { AuthContext } from '../auth-context';
import { setSession, isValidToken } from './utils';

// ----------------------------------------------------------------------

/**
 * NOTE:
 * We only build demo at basic level.
 * Customer will need to do some extra handling yourself if you want to extend the logic and other features...
 */

export function AuthProvider({ children }) {
  const { state, setState } = useSetState({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = sessionStorage.getItem(JWT_STORAGE_KEY);

      if (accessToken && isValidToken(accessToken)) {
        setSession(accessToken);

        const res = await axios.get(endpoints.auth.me);

        const payload = res?.data?.data ?? res?.data ?? {};
        const rawUser = payload.user ?? res?.data?.user;
        const permissionSlugs = payload.permissions ?? rawUser?.permissions ?? [];
        const normalized = normalizeMembershipUser(rawUser, { permissions: permissionSlugs });

        if (!normalized) {
          clearMembershipUserHeader();
          setState({ user: null, loading: false });
          return;
        }

        setMembershipUserJsonFromObject({ ...rawUser, permissions: normalized.permissions });
        const bid = normalized.branch_id ?? normalized.branchId ?? normalized.BranchID;
        const isDashboardUser =
          userHasAnyPermission(normalized, [
            PERM.ui.branchCentralList,
            PERM.ui.branchCentralCreate,
            PERM.ui.companyTenantManage,
          ]) || (bid != null && Number(bid) > 0);
        if (isDashboardUser) {
          setApiMode('branch');
          if (!getBranchIdStored() && bid != null && Number(bid) > 0) {
            setBranchIdForApi(String(bid));
          }
        }
        setState({ user: { ...normalized, accessToken }, loading: false });
      } else {
        clearMembershipUserHeader();
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      clearMembershipUserHeader();
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
