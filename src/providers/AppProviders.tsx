"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrimeReactProvider } from "primereact/api";
import { ApiError } from "@/services/http";

function shouldRetry(failureCount: number, error: unknown): boolean {
  // Don't retry client errors (401/403/404/422…); retry network and 5xx once.
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 1;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: shouldRetry, refetchOnWindowFocus: false, staleTime: 30_000 },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <PrimeReactProvider value={{ ripple: false }}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PrimeReactProvider>
  );
}
