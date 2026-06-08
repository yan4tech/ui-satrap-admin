'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { Alert, Snackbar } from '@mui/material';

const IntegrationToastContext = createContext(null);

export function IntegrationToastProvider({ children }) {
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const showToast = useCallback((message, severity = 'success') => {
    setToast({
      open: true,
      message: String(message ?? ''),
      severity: severity === 'error' || severity === 'warning' || severity === 'info' ? severity : 'success',
    });
  }, []);

  const value = useMemo(
    () => ({
      showSuccess: (message) => showToast(message, 'success'),
      showError: (message) => showToast(message, 'error'),
      showWarning: (message) => showToast(message, 'warning'),
      showInfo: (message) => showToast(message, 'info'),
    }),
    [showToast]
  );

  return (
    <IntegrationToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={4500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%', minWidth: 280 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </IntegrationToastContext.Provider>
  );
}

/** @returns {{ showSuccess: (msg: string) => void, showError: (msg: string) => void, showWarning: (msg: string) => void, showInfo: (msg: string) => void }} */
export function useIntegrationToast() {
  const ctx = useContext(IntegrationToastContext);
  if (!ctx) {
    return {
      showSuccess: () => {},
      showError: () => {},
      showWarning: () => {},
      showInfo: () => {},
    };
  }
  return ctx;
}
