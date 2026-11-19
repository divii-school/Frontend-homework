"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "./AppSidebar";
import AppTopbar from "./AppTopbar";

// Admin chrome: sidebar + topbar + page container (design 8.1.0).
// Two pieces of screen-only state:
//  - collapsed  (> 991px): icon rail; remembered per browser (localStorage, try/catch)
//  - drawerOpen (≤ 991px): overlay drawer; closes on Escape, backdrop click, link click, route change

const COLLAPSED_KEY = "tc-hw3-sidebar-collapsed";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function storeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
  } catch {
    // storage blocked — the choice just isn't remembered
  }
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  // A new page closes the phone drawer
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Escape closes the drawer
  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      storeCollapsed(!current);
      return !current;
    });
  }, []);

  const expand = useCallback(() => {
    setCollapsed(false);
    storeCollapsed(false);
  }, []);

  const classes = ["app-shell", collapsed ? "app-shell-collapsed" : "", drawerOpen ? "app-shell-nav-open" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <a href="#main-content" className="skip-link">
        본문 바로가기
      </a>
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        onExpand={expand}
        onCloseDrawer={() => setDrawerOpen(false)}
      />
      {/* Dimmed backdrop behind the drawer; clicking it closes the menu */}
      <button type="button" className="app-nav-overlay" aria-label="메뉴 닫기" tabIndex={-1} onClick={() => setDrawerOpen(false)} />
      <div className="app-main">
        <AppTopbar drawerOpen={drawerOpen} onOpenDrawer={() => setDrawerOpen(true)} />
        <main className="page-container" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
