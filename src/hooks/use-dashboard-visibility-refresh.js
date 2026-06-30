'use client';

import { useEffect, useRef } from 'react';

/** Default poll interval for dashboard hooks while the browser tab is visible. */
export const DEFAULT_DASHBOARD_REFRESH_INTERVAL_MS = 120_000;

/**
 * Optional background refresh for dashboard data hooks.
 *
 * Polls `onRefresh` every `refreshInterval` ms only while
 * `document.visibilityState === 'visible'`. When the tab is hidden the interval
 * is cleared; when it becomes visible again data is refreshed once and polling
 * resumes.
 *
 * @param {() => void | Promise<void>} onRefresh
 * @param {{ refreshInterval?: number | false | null, enabled?: boolean }} [options]
 */
export function useDashboardVisibilityRefresh(onRefresh, options = {}) {
  const { refreshInterval = DEFAULT_DASHBOARD_REFRESH_INTERVAL_MS, enabled = true } = options;
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled || refreshInterval == null || refreshInterval === false || refreshInterval <= 0) {
      return undefined;
    }

    let intervalId = null;

    const tick = () => {
      if (document.visibilityState === 'visible') {
        void onRefreshRef.current();
      }
    };

    const startInterval = () => {
      if (intervalId != null) return;
      intervalId = window.setInterval(tick, refreshInterval);
    };

    const stopInterval = () => {
      if (intervalId != null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tick();
        startInterval();
      } else {
        stopInterval();
      }
    };

    if (document.visibilityState === 'visible') {
      startInterval();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, refreshInterval]);
}
