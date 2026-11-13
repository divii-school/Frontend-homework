'use client';

import type { ReactNode } from 'react';
import { PrimeReactProvider } from 'primereact/api';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { ToastProvider } from './toast-provider';
import { AuthProvider } from './auth-provider';

/** Everything the whole app shares, in dependency order (auth needs the query client). */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PrimeReactProvider value={{ ripple: false }}>
      <QueryProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryProvider>
    </PrimeReactProvider>
  );
}
