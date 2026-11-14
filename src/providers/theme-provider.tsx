'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'hw3_theme';
/** <link id="prime-theme"> in the root layout; swapped so PrimeReact components follow the theme too. */
const PRIME_THEME_LINK_ID = 'prime-theme';
const PRIME_THEME_HREF: Record<ThemeMode, string> = {
  light: '/themes/lara-light-pink/theme.css',
  dark: '/themes/lara-dark-pink/theme.css',
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Applies the theme to <html data-theme> (our tokens) and to the PrimeReact theme stylesheet. */
function applyTheme(theme: ThemeMode): void {
  document.documentElement.dataset.theme = theme;
  const link = document.getElementById(PRIME_THEME_LINK_ID) as HTMLLinkElement | null;
  if (link && !link.href.endsWith(PRIME_THEME_HREF[theme])) link.href = PRIME_THEME_HREF[theme];
}

/**
 * Light/dark mode. The first value comes from the inline script in layout.tsx (saved choice,
 * else the OS setting), so the page never flashes the wrong theme.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
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

/** Runs before React, inside <head>: picks the saved theme (else the OS one) and adds the PrimeReact
 * theme as the FIRST stylesheet, so our own SCSS (loaded after it) wins the cascade. */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;var l=document.getElementById('${PRIME_THEME_LINK_ID}');if(!l){l=document.createElement('link');l.id='${PRIME_THEME_LINK_ID}';l.rel='stylesheet';document.head.insertBefore(l,document.head.firstChild);}l.href=t==='dark'?'${PRIME_THEME_HREF.dark}':'${PRIME_THEME_HREF.light}';}catch(e){}})();`;

