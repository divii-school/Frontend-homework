"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { loginUrlFor } from "@/lib/auth/redirect";
import { canAccess } from "@/config/navigation";
import { Forbidden } from "@/components/layout/Forbidden";

/**
 * Route guard, driven by config/navigation:
 * - logged out → /login?next=<this page>
 * - logged in but the role may not open this page → 403 (Forbidden) in place of the page
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === "anonymous") {
      const query = searchParams.toString();
      router.replace(loginUrlFor(query ? `${pathname}?${query}` : pathname));
    }
  }, [status, pathname, searchParams, router]);

  if (status !== "authenticated" || !user) {
    return (
      <div role="status" aria-live="polite" className="visually-hidden">
        로그인 상태를 확인하는 중…
      </div>
    );
  }
  if (!canAccess(pathname, user.role)) return <Forbidden />;
  return <>{children}</>;
}
