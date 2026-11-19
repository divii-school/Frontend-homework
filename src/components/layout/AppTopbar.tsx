"use client";

import { Button } from "primereact/button";
import { DEFAULT_HOME } from "@/config/navigation";
import { useLogout } from "@/hooks/useLogout";
import { useSession } from "@/hooks/useSession";
import BrandLogo from "../BrandLogo";
import ThemeToggle from "../ThemeToggle";

interface AppTopbarProps {
  drawerOpen: boolean;
  onOpenDrawer: () => void;
}

// Top bar (design 8.1.0, 54px): hamburger + logo when the sidebar is a drawer (≤ 991px);
// on the right the theme toggle, logout icon and the signed-in user's name.
export default function AppTopbar({ drawerOpen, onOpenDrawer }: AppTopbarProps) {
  const session = useSession();
  const { logout, isLoggingOut } = useLogout();
  const name = session?.user.fullName || session?.user.userId || "";

  return (
    <header className="app-topbar">
      <div className="app-topbar-start">
        <Button
          type="button"
          icon="pi pi-bars"
          text
          severity="secondary"
          className="app-topbar-menu"
          aria-label="메뉴 열기"
          aria-expanded={drawerOpen}
          aria-controls="app-sidebar"
          onClick={onOpenDrawer}
        />
        <BrandLogo href={DEFAULT_HOME} className="app-topbar-brand" />
      </div>
      <div className="app-topbar-actions">
        <ThemeToggle />
        <Button
          type="button"
          icon="pi pi-sign-out"
          text
          severity="secondary"
          aria-label="로그아웃"
          title="로그아웃"
          loading={isLoggingOut}
          onClick={logout}
        />
        <span className="app-topbar-divider" aria-hidden="true" />
        <span className="app-topbar-user" title={name}>
          <span className="sr-only">로그인 계정: </span>
          {name}
        </span>
      </div>
    </header>
  );
}
