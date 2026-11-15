"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrimeReactProvider } from "primereact/api";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { QUERY_STALE_MS } from "@/constants/api";

/** Client-side providers for the whole app: PrimeReact, the TanStack Query cache, theme, toast and the signed-in user. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: QUERY_STALE_MS, retry: false, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <PrimeReactProvider value={{ ripple: false }}>
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
