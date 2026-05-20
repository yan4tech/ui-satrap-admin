'use client';

import { useEffect, useState, useCallback } from 'react';

import { getApiMode } from 'src/lib/api-mode';
import { useAuthContext } from 'src/auth/hooks';
import { fetchMyBranchServices } from 'src/lib/service-entitlement-api';

/**
 * خدمات قابل مشاهده/اجرا برای کاربر جاری (در حالت شعبه از my-services).
 */
export function useEntitledServices() {
  const { user, loading: authLoading } = useAuthContext();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isBranchScoped =
    getApiMode() === 'branch' || Number(user?.branch_id ?? 0) > 0;

  const reload = useCallback(async () => {
    if (!isBranchScoped) {
      setServices([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const list = await fetchMyBranchServices();
      setServices(list);
    } catch (e) {
      setServices([]);
      setError(e?.message || 'خطا در دریافت خدمات مجاز');
    } finally {
      setLoading(false);
    }
  }, [isBranchScoped]);

  useEffect(() => {
    if (authLoading) return;
    reload();
  }, [authLoading, reload]);

  const processKeys = services.map((s) => s.process_key).filter(Boolean);

  const hasProcessKey = useCallback(
    (key) => processKeys.includes(String(key ?? '').trim()),
    [processKeys]
  );

  return {
    services,
    processKeys,
    hasProcessKey,
    loading: authLoading || loading,
    error,
    reload,
    isBranchEntitlementActive: isBranchScoped,
  };
}
