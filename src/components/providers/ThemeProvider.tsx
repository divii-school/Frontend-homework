'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';
interface ThemeApi {
  theme: Theme;
  toggle: () => void;
}
const KEY = 'tc_theme';
const ThemeContext = createContext<ThemeApi | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    let initial: Theme = 'light';
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') initial = saved;
      else if (window.matchMedia('(prefers-color-scheme: dark)').matches) initial = 'dark';
    } catch {
      /* storage unavailable */
    }
    setTheme(initial);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      try {
        window.localStorage.setItem(KEY, next);
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeApi {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
