"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrimeReactProvider, addLocale, localeOption } from "primereact/api";
import { ApiError } from "@/services/http";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ToastProvider } from "@/providers/ToastProvider";

// Korean labels for PrimeReact parts (Dialog / Toast close buttons).
addLocale("ko", { aria: { ...localeOption("aria", "en"), close: "닫기" } });

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
    <PrimeReactProvider value={{ ripple: false, locale: "ko" }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </PrimeReactProvider>
  );
}
