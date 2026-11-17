"use client";

import { Button } from "primereact/button";
import { useTheme } from "@/providers/ThemeProvider";

// Icon button (topbar, login corner) that flips light / dark.
export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      icon={isDark ? "pi pi-sun" : "pi pi-moon"}
      rounded
      text
      severity="secondary"
      className={className}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
    />
  );
}
