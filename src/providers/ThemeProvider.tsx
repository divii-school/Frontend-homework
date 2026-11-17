"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { activatePrimeTheme, THEME_STORAGE_KEY, type Theme } from "@/utils/theme";

// Light / dark switch. Two things change together:
//  1. <html data-theme="light|dark"> → our --color-* custom properties (globals.scss)
//  2. the matching PrimeReact theme stylesheet is switched on, the other off (public/themes)
// First visit follows the OS (prefers-color-scheme). A toggle is remembered in localStorage
// (per-browser convenience; try/catch because storage can be blocked). THEME_INIT_SCRIPT
// (src/utils/theme.ts, run in <head>) applies the same choice before the first paint.

export type { Theme };

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "light", toggleTheme: () => {} });

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  activatePrimeTheme(theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  // Pick up what the init script applied; keep following the OS until the user chooses
  useEffect(() => {
    const initial = readStoredTheme() ?? systemTheme();
    setTheme(initial);
    applyTheme(initial);

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const onSystemChange = (event: MediaQueryListEvent) => {
      if (readStoredTheme()) return;
      const next: Theme = event.matches ? "dark" : "light";
      setTheme(next);
      applyTheme(next);
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "light" ? "dark" : "light";
      applyTheme(next);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // storage blocked — the page still switches, the choice just isn't remembered
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
