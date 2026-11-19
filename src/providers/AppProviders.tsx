"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { PrimeReactProvider } from "primereact/api";
import { createQueryClient } from "@/utils/query-client";
import { registerKoreanLocale } from "./primereact-locale";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider, useToast } from "./ToastProvider";

// PrimeReact's built-in texts (paginator, dropdown, dialog …) in Korean; runs once when this module loads.
registerKoreanLocale();

// Client-side providers for the whole app: PrimeReact, theme, toast + confirm, TanStack Query.

// TanStack Query sits INSIDE ToastProvider, because its default error toast (src/utils/query-client.ts)
// goes through the one global Toast.
// One QueryClient per browser session (created inside useState so SSR never shares it).
function QueryProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [queryClient] = useState(() => createQueryClient(toast.error));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PrimeReactProvider value={{ ripple: false }}>
      <ThemeProvider>
        <ToastProvider>
          <QueryProvider>{children}</QueryProvider>
        </ToastProvider>
      </ThemeProvider>
    </PrimeReactProvider>
  );
}
