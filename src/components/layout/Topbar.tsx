"use client";

import { Button } from "primereact/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { ROUTES } from "@/constants/routes";
import { useLogout } from "@/hooks/API/auth/useAuthMutations";

/** Top bar: menu button (small screens), theme switch, user name and logout. */
export function Topbar({ menuOpen, onToggleMenu }: { menuOpen: boolean; onToggleMenu: () => void }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const logout = useLogout();

  // The session ends in this browser even if the API call fails (server down): the user asked to leave.
  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        signOut();
        window.location.assign(ROUTES.login);
      },
    });
  };

  return (
    <header className="app-topbar">
      <Button
        type="button"
        className="app-topbar-menu"
        icon="pi pi-bars"
        text
        aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={menuOpen}
        aria-controls="app-sidebar"
        onClick={onToggleMenu}
      />
      <div className="app-topbar-right">
        <Button
          type="button"
          icon={theme === "day" ? "pi pi-moon" : "pi pi-sun"}
          text
          aria-label={theme === "day" ? "다크 모드로 전환" : "라이트 모드로 전환"}
          onClick={toggleTheme}
        />
        <span className="app-topbar-user">{user?.fullName}</span>
        <Button type="button" icon="pi pi-sign-out" label="로그아웃" text loading={logout.isPending} onClick={handleLogout} />
      </div>
    </header>
  );
}
