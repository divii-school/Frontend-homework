// Theme constants shared by the root layout (server component) and ThemeProvider (client).
// Kept out of the "use client" provider file: a server component that imports from a client module
// gets client references, not values (PRIME_THEME_HREF.light would render as an empty href).
//
// How the PrimeReact theme switches: the root layout renders BOTH theme stylesheets
// (<link id="theme-link-light"> + <link id="theme-link-dark">) and the inactive one gets
// media="not all". We never change a link's href, because React 19 matches <head> links by href
// while hydrating — a changed href made hydration fail in dark mode.

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "tc-hw3-theme";
export const THEME_LINK_IDS: Record<Theme, string> = {
  light: "theme-link-light",
  dark: "theme-link-dark",
};
export const PRIME_THEME_HREF: Record<Theme, string> = {
  light: "/themes/lara-light-pink/theme.css",
  dark: "/themes/lara-dark-pink/theme.css",
};

/** Turns the matching PrimeReact stylesheet on and the other off (browser only). */
export function activatePrimeTheme(theme: Theme): void {
  (Object.keys(THEME_LINK_IDS) as Theme[]).forEach((key) => {
    const link = document.getElementById(THEME_LINK_IDS[key]);
    if (!link) return;
    if (key === theme) link.removeAttribute("media");
    else link.setAttribute("media", "not all");
  });
}

/**
 * Inline <head> script (root layout, placed after both links): runs before the first paint so dark
 * mode never flashes light. Stored choice first, otherwise the OS setting (prefers-color-scheme).
 * Same rules as ThemeProvider.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=null;try{t=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t);var off=document.getElementById(t==='dark'?'${THEME_LINK_IDS.light}':'${THEME_LINK_IDS.dark}');if(off){off.setAttribute('media','not all')}}catch(e){}})();`;
