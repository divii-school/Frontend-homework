"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { redirectToLogin } from "@/api-services/CoreAPIService";
import { useHydrated, useSession } from "@/hooks/useSession";
import { PageLoader } from "@/components";
import { getTokenExpiryMs } from "@/utils/jwt";
import { buildLoginUrl, clearSession, isLogoutInProgress, readRawSession, readSession } from "@/utils/session";

// Client half of "protected routes" for everything under (main) (middleware is the server half):
//  - no valid session in this tab → /login?returnTo=<path + query> (plain /login after a logout)
//  - the JWT expires while the page is open → same redirect at the exact `exp` moment
// Nothing protected is rendered until a session is confirmed.

const MAX_TIMEOUT_MS = 2_147_483_647; // setTimeout limit (~24.8 days)

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const session = useSession();

  // Check storage directly (not the hook value) so the first effect never sees the hydration `null`.
  // Only a stale session stored in this tab is cleared; a tab with nothing stored leaves the shared
  // cookie alone, so another tab that is still logged in is not logged out by it.
  useEffect(() => {
    if (readSession()) return;
    if (readRawSession()) clearSession();
    router.replace(isLogoutInProgress() ? "/login" : buildLoginUrl());
  }, [session, pathname, router]);

  // Token expiry → back to login with returnTo
  useEffect(() => {
    if (!session) return;
    const expiry = getTokenExpiryMs(session.token);
    if (!expiry) return;
    const timer = window.setTimeout(() => redirectToLogin(), Math.min(Math.max(expiry - Date.now(), 0), MAX_TIMEOUT_MS));
    return () => window.clearTimeout(timer);
  }, [session]);

  if (!hydrated || !session) return <PageLoader label="로그인 정보를 확인하는 중…" />;
  return <>{children}</>;
}
