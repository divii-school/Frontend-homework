"use client";

import { useEffect } from "react";
import { BrandLogo, ErrorState } from "@/components";

// App-level error boundary for anything outside the admin shell (login, 403 …).
// Screens inside the shell use src/app/(main)/error.tsx so the menu stays visible.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep the details for the developer console only; the user sees a plain message
    console.error(error);
  }, [error]);

  return (
    <main className="full-page">
      <section className="error-page-card">
        <div className="error-page-brand">
          <BrandLogo />
        </div>
        <ErrorState variant="server" titleAs="h1" title="오류가 발생했습니다" onRetry={reset} />
      </section>
    </main>
  );
}
