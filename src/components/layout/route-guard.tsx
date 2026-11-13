'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ROUTES } from '@/config/app-routes';
import { canOpenPath } from '@/lib/auth/permissions';
import { useAuth } from '@/providers/auth-provider';
import { StateBlock } from '@/components/common/state-block';

/**
 * Step 2 of the route guard (step 1, "logged in at all?", is middleware.ts).
 * - Session not restored yet → nothing (no flash of a page the user may not see).
 * - No user → /login?returnTo=<this page>.
 * - User lacks the route's permission (app-routes.ts) → 403 view, URL kept, nothing loaded.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  // This guard sits in a Suspense boundary that hydrates AFTER the auth provider has read the
  // session, so its first render must not depend on it (else server and client HTML differ).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (ready && !user) {
      const query = search.toString();
      const here = query ? `${pathname}?${query}` : pathname;
      router.replace(`${ROUTES.login}?returnTo=${encodeURIComponent(here)}`);
    }
  }, [ready, user, pathname, search, router]);

  if (!hydrated || !ready || !user) return <StateBlock variant="loading" title="불러오는 중입니다." />;

  if (!canOpenPath(user, pathname)) {
    return (
      <StateBlock
        variant="forbidden"
        title="403 · 접근 권한이 없습니다."
        description={'이 메뉴를 사용할 권한이 없습니다.\n권한이 필요하면 최고관리자에게 문의해 주세요.'}
      />
    );
  }

  return <>{children}</>;
}
