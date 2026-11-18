/** Light/dark theme constants shared by the root layout (server) and ThemeProvider (client). */
export type ThemeMode = 'light' | 'dark';

/** localStorage key of the saved choice. */
export const THEME_STORAGE_KEY = 'hw3_theme';

/**
 * The PrimeReact theme as two server-rendered <link>s; the one not in use is `disabled` (the browser does not even
 * download it until it is enabled). Only `disabled` changes, never `href`: React 19 finds a <head> stylesheet by its
 * href when it hydrates, so a changed href (or a link added by a script) makes it rebuild the page (React #418).
 */
export const PRIME_THEME_LINKS: Record<ThemeMode, { id: string; href: string }> = {
  light: { id: 'prime-theme-light', href: '/themes/lara-light-pink/theme.css' },
  dark: { id: 'prime-theme-dark', href: '/themes/lara-dark-pink/theme.css' },
};

/**
 * Runs before React, inside <head>, right after the two theme links: picks the saved theme (else the OS one), sets
 * <html data-theme> and enables the matching link. It adds no element and changes no href.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;var l=document.getElementById('${PRIME_THEME_LINKS.light.id}'),d=document.getElementById('${PRIME_THEME_LINKS.dark.id}');if(l&&d){l.disabled=t==='dark';d.disabled=t!=='dark';}}catch(e){}})();`;
