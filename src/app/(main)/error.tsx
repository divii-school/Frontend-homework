"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components";

// Error boundary for screens inside the admin shell: the menu stays, the content shows the error.
export default function MainError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="content-card">
      <ErrorState error={error} variant="server" title="오류가 발생했습니다" onRetry={reset} />
    </section>
  );
}
