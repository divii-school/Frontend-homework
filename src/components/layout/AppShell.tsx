"use client";

import { useState, type ReactNode } from "react";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

/** Frame of every signed-in page: menu on the left, bar on top, the guarded page in the middle. */
export function AppShell({ children }: { children: ReactNode }) {
  // Only matters below the tablet breakpoint, where the menu is a drawer.
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <button type="button" className="app-shell-overlay" aria-label="메뉴 닫기" onClick={() => setMenuOpen(false)} />}
      <div className="app-shell-body">
        <Topbar menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((open) => !open)} />
        <main className="app-main" id="main-content">
          <RouteGuard>{children}</RouteGuard>
        </main>
      </div>
    </div>
  );
}
