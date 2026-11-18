'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { errorMessage } from '@/lib/api/error-messages';
import { needsDefaultToast, shouldRetry } from '@/lib/api/query-defaults';
import { useToast } from './toast-provider';

/**
 * One QueryClient per browser tab (created in state so it survives re-renders).
 * QueryCache / MutationCache see every failure; one the screen does not handle gets a toast,
 * so a new screen that forgets its error state still tells the user something went wrong.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (needsDefaultToast(error, query.meta)) toast.show('error', errorMessage(error));
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (needsDefaultToast(error, mutation.meta)) toast.show('error', errorMessage(error));
          },
        }),
        defaultOptions: {
          queries: { staleTime: 30_000, retry: shouldRetry, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
