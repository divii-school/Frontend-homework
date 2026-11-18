"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrimeReactProvider } from "primereact/api";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { PRIMEREACT_LOCALE, registerKoreanLocale } from "@/config/primereact-locale";
import { QUERY_RETRY_COUNT, QUERY_RETRY_DELAY_MS, QUERY_STALE_MS } from "@/constants/api";
import { ApiError } from "@/types/api";

// PrimeReact's own texts (screen-reader labels, empty lists) in Korean, before the first component draws
registerKoreanLocale();

/** Client-side providers for the whole app: PrimeReact, the TanStack Query cache, theme, toast and the signed-in user. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: QUERY_STALE_MS,
            refetchOnWindowFocus: false,
            // The QA API now and then gives no answer. Such a read (or a 5xx) is tried once more by itself;
            // a 4xx is a real answer (wrong input, no permission, not found) and is shown at once.
            retry: (failureCount, error) =>
              failureCount < QUERY_RETRY_COUNT && error instanceof ApiError && (error.kind === "network" || error.kind === "server"),
            retryDelay: QUERY_RETRY_DELAY_MS,
          },
        },
      }),
  );

  return (
    <PrimeReactProvider value={{ ripple: false, locale: PRIMEREACT_LOCALE }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </PrimeReactProvider>
  );
}
