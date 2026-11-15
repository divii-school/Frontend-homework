"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { StateBlock } from "@/components/common/StateBlock";
import { useAuth } from "@/components/providers/AuthProvider";
import { canOpen, visibleNavItems } from "@/config/navigation";
import { loginUrlFor } from "@/utils/session";

/**
 * Wraps every page inside the shell and decides, from config/navigation.ts, whether this user may see it.
 * - storage not read yet -> spinner (never flash a page the user may not see);
 * - no user            -> login, with the page to return to (middleware normally caught this already);
 * - no permission      -> the 403 block in place of the page. The URL stays, so the user sees what was refused.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (ready && !user) {
      const query = searchParams.toString();
      window.location.assign(loginUrlFor(query ? `${pathname}?${query}` : pathname));
    }
  }, [ready, user, pathname, searchParams]);

  if (!ready || !user) return <StateBlock kind="loading" title="불러오는 중입니다." />;

  if (!canOpen(user, pathname)) {
    const firstAllowed = visibleNavItems(user)[0];
    return (
      <StateBlock
        kind="forbidden"
        title="접근 권한이 없습니다. (403)"
        description="이 페이지를 볼 수 있는 권한이 없습니다. 권한이 필요하면 관리자에게 문의해 주세요."
        action={
          firstAllowed && (
            <Link className="link-button" href={firstAllowed.path}>
              {firstAllowed.label}(으)로 이동
            </Link>
          )
        }
      />
    );
  }
  return <>{children}</>;
}
