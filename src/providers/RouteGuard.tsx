"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canAccess } from "@/config/navigation";
import { useSession } from "@/hooks/useSession";
import { PageLoader } from "@/components";

// Role / permission half of the route guard (runs inside AuthGate, so a session exists).
// Uses the same canAccess() as the sidebar: a URL the user can't open → /403?from=<path>.
// Covers what the middleware can't see: GENERAL_ADMIN module permissions (not in the JWT).
export default function RouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const allowed = canAccess(session?.user, pathname);

  useEffect(() => {
    if (session && !allowed) router.replace(`/403?from=${encodeURIComponent(pathname)}`);
  }, [session, allowed, pathname, router]);

  if (!allowed) return <PageLoader label="Checking permissions…" />;
  return <>{children}</>;
}
