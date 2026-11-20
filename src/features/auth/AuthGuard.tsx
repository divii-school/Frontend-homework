'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ProgressSpinner } from 'primereact/progressspinner';
import { canAccessPath } from '@/config/access';
import { loginUrlWithReturn, useAuth } from './AuthProvider';

/** Route guard: not logged in → /login?returnTo=…, no permission → /403. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allowed = canAccessPath(profile?.role, pathname);

  useEffect(() => {
    if (status === 'anonymous') router.replace(loginUrlWithReturn(pathname, searchParams.toString()));
    else if (status === 'authenticated' && !allowed) router.replace('/403');
  }, [status, allowed, pathname, searchParams, router]);

  if (status !== 'authenticated' || !allowed) {
    return (
      <div className="page-center" role="status" aria-live="polite">
        <ProgressSpinner style={{ width: 40, height: 40 }} strokeWidth="4" />
        <span className="sr-only">불러오는 중입니다.</span>
      </div>
    );
  }
  return <>{children}</>;
}
