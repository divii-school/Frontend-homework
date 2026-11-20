"use client";

import { useSyncExternalStore } from "react";
import { readTheme, setTheme, subscribeTheme, type Theme } from "@/lib/theme/theme";
import { IconMoon, IconSun } from "@/components/icons";
import styles from "./AdminShell.module.scss";

/** Header switch between light and dark mode. Shows the mode you switch TO. */
export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme | null>(subscribeTheme, readTheme, () => null);
  if (theme === null) return <span className={styles["theme-toggle"]} aria-hidden />;
  const dark = theme === "dark";
  const label = dark ? "라이트 모드로 전환" : "다크 모드로 전환";
  return (
    <button
      type="button"
      className={styles["theme-toggle"]}
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
    >
      {dark ? <IconSun /> : <IconMoon />}
    </button>
  );
}
