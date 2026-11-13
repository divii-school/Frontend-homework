"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAVIGATION } from "@/config/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { LOGIN_PATH } from "@/lib/auth/redirect";
import { IconArrowDown, IconBars, IconLogout } from "@/components/icons";
import styles from "./AdminShell.module.scss";

/** Sidebar + header from Figma "Main menu_admin" / "header". Menu items come from config/navigation. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
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
        Skip to content
      </a>

      <aside id="admin-nav" className={`${styles.sidebar} ${drawerOpen ? styles.sidebarOpen : ""}`} aria-label="Main menu">
        <div className={styles.brandRow}>
          <Link href="/shopping/products" className={styles.brand} onClick={() => setDrawerOpen(false)}>
            <Image src="/images/talkingclub-logo@2x.png" alt="Talking Club Admin" width={158} height={30} className={styles.logo} priority />
          </Link>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.mobileOnly}`}
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <IconBars />
          </button>
        </div>

        <nav>
          <ul className={styles.menu}>
            {NAVIGATION.map((group) => {
              const GroupIcon = group.icon;
              const active = group.pages.some((p) => pathname.startsWith(p.href));
              const open = openGroups[group.label] ?? false;
              const listId = `nav-${group.label.replace(/\W+/g, "-").toLowerCase()}`;
              return (
                <li key={group.label}>
                  <button
                    type="button"
                    className={`${styles.groupButton} ${active ? styles.active : ""}`}
                    aria-expanded={open}
                    aria-controls={listId}
                    onClick={() => setOpenGroups((s) => ({ ...s, [group.label]: !open }))}
                  >
                    <GroupIcon className={styles.groupIcon} />
                    <span className={styles.groupLabel}>{group.label}</span>
                    <IconArrowDown className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} />
                  </button>
                  {open && (
                    <ul id={listId} className={styles.subMenu}>
                      {group.pages.map((page) => {
                        const current = pathname === page.href || pathname.startsWith(`${page.href}/`);
                        return (
                          <li key={page.href}>
                            <Link
                              href={page.href}
                              className={`${styles.subLink} ${current ? styles.subLinkActive : ""}`}
                              aria-current={current ? "page" : undefined}
                              onClick={() => setDrawerOpen(false)}
                            >
                              <span className={styles.bullet} aria-hidden />
                              {page.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {drawerOpen && <div className={styles.backdrop} onClick={() => setDrawerOpen(false)} aria-hidden />}

      <div className={styles.body}>
        <header className={styles.header}>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.mobileOnly}`}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            aria-controls="admin-nav"
          >
            <IconBars />
          </button>
          <div className={styles.headerRight}>
            <button type="button" className={styles.logout} onClick={handleLogout} aria-label="Log out" title="Log out">
              <IconLogout />
            </button>
            <span className={styles.divider} aria-hidden />
            <span className={styles.userName}>Admin</span>
          </div>
        </header>

        <main id="main" className={styles.main} tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
