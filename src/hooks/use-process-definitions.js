'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAuthContext } from 'src/auth/hooks';
import { isCentralAdmin } from 'src/lib/admin-access';
import { listProcessDefinitions } from 'src/lib/integration-api';
import { processDefinitionsToOptions } from 'src/app/dashboard/admin/integration/_lib/process-bpmn-steps';

/**
 * تعاریف فعال فرایند از موتور — برای منوی Integration و Process Binding.
 */
export function useProcessDefinitions() {
  const { user, loading: authLoading } = useAuthContext();
  const [definitions, setDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const enabled = isCentralAdmin(user);

  const reload = useCallback(async () => {
    if (!enabled) {
      setDefinitions([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const items = await listProcessDefinitions();
      setDefinitions(items);
    } catch (e) {
      setDefinitions([]);
      setError(e?.message || 'خطا در دریافت تعاریف فرایند');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (authLoading) return;
    reload();
  }, [authLoading, reload]);

  return {
    definitions,
    options: processDefinitionsToOptions(definitions),
    loading: authLoading || loading,
    error,
    reload,
    enabled,
  };
}
