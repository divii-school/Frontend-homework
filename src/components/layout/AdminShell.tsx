"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAVIGATION, OUT_OF_SCOPE_MENU, navigationFor } from "@/config/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/features/auth/AuthProvider";
import { LOGIN_PATH } from "@/lib/auth/redirect";
import { IconArrowDown, IconBars, IconLogout } from "@/components/icons";
import styles from "./AdminShell.module.scss";

/** Sidebar + header from Figma "Main menu_admin" / "header". Menu items come from config/navigation. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  // Only the pages this role may open (same config as the route guard).
  const menu = useMemo(() => navigationFor(user?.role ?? ""), [user?.role]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAVIGATION.map((g) => [g.label, true])),
  );

  // Close the mobile drawer with Escape.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  async function handleLogout() {
    await logout();
    router.replace(LOGIN_PATH);
  }

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        본문 바로가기
      </a>

      <aside id="admin-nav" className={`${styles.sidebar} ${drawerOpen ? styles["sidebar-open"] : ""}`} aria-label="주 메뉴">
        <div className={styles["brand-row"]}>
          <Link href="/shopping/products" className={styles.brand} onClick={() => setDrawerOpen(false)}>
            <Image src="/images/talkingclub-logo@2x.png" alt="토킹클럽 관리자" width={158} height={30} className={styles.logo} priority />
          </Link>
          <button
            type="button"
            className={`${styles["icon-button"]} ${styles["mobile-only"]}`}
            onClick={() => setDrawerOpen(false)}
            aria-label="메뉴 닫기"
          >
            <IconBars />
          </button>
        </div>

        <nav>
          <ul className={styles.menu}>
            {OUT_OF_SCOPE_MENU.before.map((label) => (
              <OutOfScope key={label} label={label} />
            ))}
            {menu.map((group) => {
              const GroupIcon = group.icon;
              const active = group.pages.some((p) => pathname.startsWith(p.href));
              const open = openGroups[group.label] ?? false;
              const listId = `nav-${group.pages[0]?.href.replace(/\W+/g, "-") ?? "group"}`;
              return (
                <li key={group.label}>
                  <button
                    type="button"
                    className={`${styles["group-button"]} ${active ? styles.active : ""}`}
                    aria-expanded={open}
                    aria-controls={listId}
                    onClick={() => setOpenGroups((s) => ({ ...s, [group.label]: !open }))}
                  >
                    <GroupIcon className={styles["group-icon"]} />
                    <span className={styles["group-label"]}>{group.label}</span>
                    <IconArrowDown className={`${styles.chevron} ${open ? styles["chevron-open"] : ""}`} />
                  </button>
                  {open && (
                    <ul id={listId} className={styles["sub-menu"]}>
                      {group.pages.map((page) => {
                        const current = pathname === page.href || pathname.startsWith(`${page.href}/`);
                        return (
                          <li key={page.href}>
                            <Link
                              href={page.href}
                              className={`${styles["sub-link"]} ${current ? styles["sub-link-active"] : ""}`}
                              aria-current={current ? "page" : undefined}
                              onClick={() => setDrawerOpen(false)}
                            >
                              <span className={styles.bullet} aria-hidden />
                              {page.label}
                            </Link>
                          </li>
                        );
                      })}
                      {OUT_OF_SCOPE_MENU.shoppingPages.map((label) => (
                        <li key={label}>
                          <span className={`${styles["sub-link"]} ${styles["out-of-scope"]}`}>
                            <span className={styles.bullet} aria-hidden />
                            {label}
                            <span className="visually-hidden"> (사용할 수 없음)</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
            {OUT_OF_SCOPE_MENU.after.map((label) => (
              <OutOfScope key={label} label={label} />
            ))}
          </ul>
        </nav>
      </aside>

      {drawerOpen && <div className={styles.backdrop} onClick={() => setDrawerOpen(false)} aria-hidden />}

      <div className={styles.body}>
        <header className={styles.header}>
          <button
            type="button"
            className={`${styles["icon-button"]} ${styles["mobile-only"]}`}
            onClick={() => setDrawerOpen(true)}
            aria-label="메뉴 열기"
            aria-expanded={drawerOpen}
            aria-controls="admin-nav"
          >
            <IconBars />
          </button>
          <div className={styles["header-right"]}>
            <ThemeToggle />
            <button type="button" className={styles.logout} onClick={handleLogout} aria-label="로그아웃" title="로그아웃">
              <IconLogout />
            </button>
            <span className={styles["user-name"]}>{user?.fullName || "관리자"}</span>
          </div>
        </header>

        <main id="main" className={styles.main} tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

/** A Figma menu item outside HW3: greyed out, not a link. */
function OutOfScope({ label }: { label: string }) {
  return (
    <li>
      <span className={`${styles["group-button"]} ${styles["out-of-scope"]}`}>
        <span className={styles["group-icon-placeholder"]} aria-hidden />
        <span className={styles["group-label"]}>{label}</span>
        <span className="visually-hidden"> (사용할 수 없음)</span>
      </span>
    </li>
  );
}
