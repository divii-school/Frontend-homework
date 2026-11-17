'use client';

import type { ReactNode } from 'react';
import { PrimeReactProvider } from 'primereact/api';
import { PRIME_LOCALE } from '@/config/primereact-locale';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { ToastProvider } from './toast-provider';
import { AuthProvider } from './auth-provider';

/**
 * Everything the whole app shares, in dependency order: the query client needs the toast
 * (default error toast), and auth needs the query client.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PrimeReactProvider value={{ ripple: false, locale: PRIME_LOCALE }}>
      <ToastProvider>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </ToastProvider>
    </PrimeReactProvider>
  );
}
