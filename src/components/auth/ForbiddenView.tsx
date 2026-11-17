"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { firstAccessibleHref, findNavItem, matchRoute } from "@/config/navigation";
import { useLogout } from "@/hooks/useLogout";
import { useHydrated, useSession } from "@/hooks/useSession";
import BrandLogo from "../BrandLogo";
import ErrorState from "../ErrorState";

// Body of /403: which page was refused, a way to a page the user CAN open, and a way to switch account.
export default function ForbiddenView() {
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const session = useSession();
  const { logout, isLoggingOut } = useLogout();

  const from = searchParams.get("from") ?? "";
  const refusedLabel = from ? matchRoute(from)?.item.label : undefined;
  const homeHref = hydrated ? firstAccessibleHref(session?.user) : null;
  const homeLabel = homeHref ? (matchRoute(homeHref)?.item.label ?? findNavItem("products")?.label) : undefined;

  return (
    <section className="error-page-card" aria-label="권한 없음">
      <div className="error-page-brand">
        <BrandLogo suffix="Admin" />
      </div>
      <ErrorState
        variant="forbidden"
        titleAs="h1"
        title="권한 없음"
        message={
          refusedLabel
            ? `“${refusedLabel}” 화면을 열 수 있는 권한이 없습니다. 권한이 필요하면 최고관리자에게 문의해 주세요.`
            : "이 페이지를 열 수 있는 권한이 없습니다. 권한이 필요하면 최고관리자에게 문의해 주세요."
        }
        actions={
          <>
            {homeHref && (
              <Link href={homeHref} className="p-button p-component">
                <span className="p-button-label">{homeLabel}로 이동</span>
              </Link>
            )}
            {session ? (
              <Button type="button" label="다른 계정으로 로그인" outlined loading={isLoggingOut} onClick={logout} />
            ) : (
              <Link href="/login" className="p-button p-component p-button-outlined">
                <span className="p-button-label">로그인 화면으로 이동</span>
              </Link>
            )}
          </>
        }
      />
    </section>
  );
}
