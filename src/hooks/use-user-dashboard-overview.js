'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import { useRouter, usePathname } from 'src/routes/hooks';

import { fetchUserOverview, isDashboardForbiddenError } from 'src/lib/dashboard-api';
import { mapUserOverview } from 'src/app/dashboard/_lib/dashboard-mappers';
import { canViewBranchUserDashboard } from 'src/lib/dashboard-nav-permissions';
import { getDashboardApiForbiddenRedirect } from 'src/lib/dashboard-access';

import { useAuthContext } from 'src/auth/hooks';

import {
  DEFAULT_DASHBOARD_REFRESH_INTERVAL_MS,
  useDashboardVisibilityRefresh,
} from './use-dashboard-visibility-refresh';

const STALE_TIME_MS = 2 * 60 * 1000;

/** @type {Map<string, { data: ReturnType<typeof mapUserOverview>, ts: number }>} */
const cache = new Map();

/**
 * SWR-style query key for user dashboard overview.
 * @param {string | number | null | undefined} userId
 * @returns {['dashboard', 'user', string | null]}
 */
export function getUserDashboardQueryKey(userId) {
  const id =
    userId != null && String(userId).trim() !== '' ? String(userId).trim() : null;
  return ['dashboard', 'user', id];
}

function resolveUserId(user) {
  const fromUser = user?.id ?? user?.ID ?? user?.user_id ?? user?.UserID;
  if (fromUser != null && String(fromUser).trim() !== '') {
    return String(fromUser).trim();
  }
  return null;
}

/**
 * Branch user (operational) dashboard — `GET /engine/dashboard/user/overview`.
 * Cache key: `['dashboard','user', userId]` · staleTime: 2min.
 *
 * Auto-refresh (optional): pass `refreshInterval` (default 120000 ms) to poll while
 * the browser tab is visible (`document.visibilityState === 'visible'`). Polling
 * pauses when the tab is hidden and resumes (with an immediate fetch) on focus.
 * Pass `refreshInterval: 0` or `false` to disable.
 *
 * @param {{ refreshInterval?: number | false }} [options]
 * @returns {{
 *   data: ReturnType<typeof mapUserOverview> | null,
 *   error: string | null,
 *   isLoading: boolean,
 *   mutate: () => Promise<void>,
 *   refresh: () => Promise<void>,
 *   enabled: boolean,
 *   queryKey: ReturnType<typeof getUserDashboardQueryKey>,
 * }}
 */
export function useUserDashboardOverview(options = {}) {
  const { refreshInterval = DEFAULT_DASHBOARD_REFRESH_INTERVAL_MS } = options;
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuthContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const enabled = canViewBranchUserDashboard(user);
  const userKey = resolveUserId(user);
  const queryKey = getUserDashboardQueryKey(userKey);
  const cacheKey = JSON.stringify(queryKey);

  const refresh = useCallback(
    async (force = false) => {
      if (!enabled) {
        setData(null);
        setLoading(false);
        setError(null);
        return;
      }

      const cached = cache.get(cacheKey);
      if (!force && cached && Date.now() - cached.ts < STALE_TIME_MS) {
        setData(cached.data);
        setLoading(false);
        setError(null);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const raw = await fetchUserOverview({ signal: controller.signal });
        const mapped = mapUserOverview(raw);
        cache.set(cacheKey, { data: mapped, ts: Date.now() });
        setData(mapped);
      } catch (e) {
        if (e?.name === 'AbortError') return;
        if (isDashboardForbiddenError(e)) {
          const redirect = getDashboardApiForbiddenRedirect(pathname, user);
          if (redirect && redirect !== pathname) {
            router.replace(redirect);
            return;
          }
        }
        setData(null);
        setError(e?.message || 'خطا در دریافت داشبورد کاربر');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [cacheKey, enabled, pathname, router, user]
  );

  useEffect(() => {
    if (authLoading) return undefined;
    refresh();
    return () => abortRef.current?.abort();
  }, [authLoading, refresh]);

  const forceRefresh = useCallback(() => refresh(true), [refresh]);

  useDashboardVisibilityRefresh(forceRefresh, {
    refreshInterval,
    enabled: enabled && !authLoading,
  });

  return {
    data,
    error,
    isLoading: authLoading || loading,
    mutate: () => refresh(false),
    refresh: () => refresh(true),
    enabled,
    queryKey,
  };
}
