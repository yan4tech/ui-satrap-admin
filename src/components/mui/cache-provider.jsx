'use client';

import rtlPlugin from '@mui/stylis-plugin-rtl';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

export function MuiCacheProvider({ children }) {
  return (
    <AppRouterCacheProvider options={{ key: 'rtl', stylisPlugins: [rtlPlugin] }}>
      {children}
    </AppRouterCacheProvider>
  );
}
