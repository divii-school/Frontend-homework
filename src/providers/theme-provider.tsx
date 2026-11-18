'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PRIME_THEME_LINKS, THEME_STORAGE_KEY as STORAGE_KEY, type ThemeMode } from '@/config/theme';

/** Re-exported for existing imports. */
export type { ThemeMode };

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Applies the theme to <html data-theme> (our tokens) and enables the matching PrimeReact theme stylesheet. */
function applyTheme(theme: ThemeMode): void {
  document.documentElement.dataset.theme = theme;
  for (const mode of ['light', 'dark'] as const) {
    const link = document.getElementById(PRIME_THEME_LINKS[mode].id) as HTMLLinkElement | null;
    if (link) link.disabled = mode !== theme;
  }
}

/**
 * Light/dark mode. The first value comes from the inline script in layout.tsx (saved choice,
 * else the OS setting), so the page never flashes the wrong theme.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    // The boot script normally set <html data-theme> already. If React re-rendered <html> during
    // hydration (it can drop attributes it did not render), work the theme out again and re-apply it.
    const fromBoot = document.documentElement.dataset.theme;
    let initial: ThemeMode;
    if (fromBoot === 'dark' || fromBoot === 'light') initial = fromBoot;
    else {
      let saved: string | null = null;
      try {
        saved = window.localStorage.getItem(STORAGE_KEY);
      } catch {
        // Private mode: fall back to the OS setting.
      }
      initial = saved === 'dark' || saved === 'light' ? saved : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(initial);
    setTheme(initial);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private mode: the choice simply is not remembered.
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
