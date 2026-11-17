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
    <section className="error-page-card" aria-label="No permission">
      <div className="error-page-brand">
        <BrandLogo suffix="Admin" />
      </div>
      <ErrorState
        variant="forbidden"
        titleAs="h1"
        title="No permission"
        message={
          refusedLabel
            ? `Your account cannot open “${refusedLabel}”. Ask a super admin if you need access.`
            : "Your account cannot open this page. Ask a super admin if you need access."
        }
        actions={
          <>
            {homeHref && (
              <Link href={homeHref} className="p-button p-component">
                <span className="p-button-label">Go to {homeLabel}</span>
              </Link>
            )}
            {session ? (
              <Button type="button" label="Log in with another account" outlined loading={isLoggingOut} onClick={logout} />
            ) : (
              <Link href="/login" className="p-button p-component p-button-outlined">
                <span className="p-button-label">Go to login</span>
              </Link>
            )}
          </>
        }
      />
    </section>
  );
}
