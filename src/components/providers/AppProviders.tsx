'use client';

import { Suspense, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import { ApiError } from '@/lib/api/client';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from './ToastProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Never retry auth / permission / not-found errors.
            retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 1,
          },
        },
      }),
  );
  return (
    <PrimeReactProvider value={{ ripple: false }}>
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <ToastProvider>
            <Suspense fallback={null}>
              <AuthProvider>{children}</AuthProvider>
            </Suspense>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </PrimeReactProvider>
  );
}
