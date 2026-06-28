'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import { useRouter, usePathname } from 'src/routes/hooks';

import { fetchBranchOverview, isDashboardForbiddenError } from 'src/lib/dashboard-api';
import { getBranchIdStored } from 'src/lib/api-branch-header';
import { canViewBranchDashboard } from 'src/lib/dashboard-nav-permissions';
import { getDashboardApiForbiddenRedirect } from 'src/lib/dashboard-access';
import { mapBranchOverview } from 'src/app/dashboard/_lib/dashboard-mappers';

import { useAuthContext } from 'src/auth/hooks';

import {
  DEFAULT_DASHBOARD_REFRESH_INTERVAL_MS,
  useDashboardVisibilityRefresh,
} from './use-dashboard-visibility-refresh';

const STALE_TIME_MS = 2 * 60 * 1000;

/** @type {Map<string, { data: ReturnType<typeof mapBranchOverview>, ts: number }>} */
const cache = new Map();

/**
 * SWR-style query key for branch dashboard overview.
 * @param {string | number | null | undefined} branchId
 * @returns {['dashboard', 'branch', string | null]}
 */
export function getBranchDashboardQueryKey(branchId) {
  const id =
    branchId != null && String(branchId).trim() !== '' ? String(branchId).trim() : null;
  return ['dashboard', 'branch', id];
}

function resolveBranchId(user, branchIdOverride) {
  if (branchIdOverride != null && String(branchIdOverride).trim() !== '') {
    return String(branchIdOverride).trim();
  }
  const fromUser = user?.branch_id ?? user?.branchId ?? user?.BranchID;
  if (fromUser != null && String(fromUser).trim() !== '' && Number(fromUser) > 0) {
    return String(fromUser).trim();
  }
  const stored = getBranchIdStored();
  return stored || null;
}

/**
 * Branch admin dashboard — `GET /engine/dashboard/branch/overview`.
 * Cache key: `['dashboard','branch', branchId]` · staleTime: 2min.
 *
 * Auto-refresh (optional): pass `refreshInterval` (default 120000 ms) to poll while
 * the browser tab is visible (`document.visibilityState === 'visible'`). Polling
 * pauses when the tab is hidden and resumes (with an immediate fetch) on focus.
 * Pass `refreshInterval: 0` or `false` to disable.
 *
 * @param {{ branchId?: string | number | null, refreshInterval?: number | false }} [options]
 * @returns {{
 *   data: ReturnType<typeof mapBranchOverview> | null,
 *   error: string | null,
 *   isLoading: boolean,
 *   mutate: () => Promise<void>,
 *   refresh: () => Promise<void>,
 *   enabled: boolean,
 *   queryKey: ReturnType<typeof getBranchDashboardQueryKey>,
 * }}
 */
export function useBranchDashboardOverview(options = {}) {
  const {
    branchId: branchIdOverride,
    refreshInterval = DEFAULT_DASHBOARD_REFRESH_INTERVAL_MS,
  } = options;
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuthContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const enabled = canViewBranchDashboard(user);
  const branchKey = resolveBranchId(user, branchIdOverride);
  const queryKey = getBranchDashboardQueryKey(branchKey);
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
        const raw = await fetchBranchOverview({
          branchId: branchKey ?? undefined,
          signal: controller.signal,
        });
        const mapped = mapBranchOverview(raw);
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
        setError(e?.message || 'خطا در دریافت داشبورد شعبه');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [branchKey, cacheKey, enabled, pathname, router, user]
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
