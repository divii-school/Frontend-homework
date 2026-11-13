'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ApiError } from '@/lib/api/api-error';

/** Do not retry errors a retry cannot fix (auth, permission, not found, validation). */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && ['unauthorized', 'forbidden', 'notFound', 'validation', 'business'].includes(error.kind)) {
    return false;
  }
  return failureCount < 2;
}

/** One QueryClient per browser tab (created in state so it survives re-renders). */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: shouldRetry, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
