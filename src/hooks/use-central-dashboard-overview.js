'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import { useRouter, usePathname } from 'src/routes/hooks';

import { fetchCentralOverview, isDashboardForbiddenError } from 'src/lib/dashboard-api';
import { getDashboardApiForbiddenRedirect } from 'src/lib/dashboard-access';
import { canViewCentralDashboard } from 'src/lib/dashboard-nav-permissions';
import { mapCentralOverview } from 'src/app/dashboard/_lib/dashboard-mappers';

import { useAuthContext } from 'src/auth/hooks';

import {
  DEFAULT_DASHBOARD_REFRESH_INTERVAL_MS,
  useDashboardVisibilityRefresh,
} from './use-dashboard-visibility-refresh';

const STALE_TIME_MS = 2 * 60 * 1000;

/** @type {Map<string, { data: ReturnType<typeof mapCentralOverview>, ts: number }>} */
const cache = new Map();

/**
 * @returns {['dashboard', 'central']}
 */
export function getCentralDashboardQueryKey() {
  return ['dashboard', 'central'];
}

/**
 * Central branch dashboard — `GET /engine/dashboard/central/overview`.
 *
 * @param {{ refreshInterval?: number | false }} [options]
 */
export function useCentralDashboardOverview(options = {}) {
  const { refreshInterval = DEFAULT_DASHBOARD_REFRESH_INTERVAL_MS } = options;
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuthContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const enabled = canViewCentralDashboard(user);
  const queryKey = getCentralDashboardQueryKey();
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
        const raw = await fetchCentralOverview({ signal: controller.signal });
        const mapped = mapCentralOverview(raw);
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
        setError(e?.message || 'خطا در دریافت داشبورد شعبه مرکزی');
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
