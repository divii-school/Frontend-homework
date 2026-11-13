"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { loginUrlFor } from "@/lib/auth/redirect";

/** Route guard: logged-out users go to /login?next=<this page>. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === "anonymous") {
      const query = searchParams.toString();
      router.replace(loginUrlFor(query ? `${pathname}?${query}` : pathname));
    }
  }, [status, pathname, searchParams, router]);

  if (status !== "authenticated") {
    return (
      <div role="status" aria-live="polite" className="visually-hidden">
        Checking your session…
      </div>
    );
  }
  return <>{children}</>;
}
