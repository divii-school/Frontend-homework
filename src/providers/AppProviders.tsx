"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrimeReactProvider } from "primereact/api";
import { isApiError } from "@/types/api";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";

// Client-side providers for the whole app: TanStack Query, PrimeReact, theme, toast + confirm.
// One QueryClient per browser session (created inside useState so SSR never shares it).

const STALE_TIME_MS = 30_000;

/** Retry once on network / 5xx; never on 4xx (validation, 401, 403, 404 won't fix themselves). */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  return isApiError(error) && (error.kind === "network" || error.kind === "server");
}

export default function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: STALE_TIME_MS, retry: shouldRetry, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider value={{ ripple: false }}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </PrimeReactProvider>
    </QueryClientProvider>
  );
}
