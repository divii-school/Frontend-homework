/**
 * Light / dark switch (design review 2026-11-20, should-fix 5).
 * The choice is kept in localStorage and set as <html data-theme="…">; _tokens.scss reads it.
 * With no stored choice the computer's setting (prefers-color-scheme) is used.
 */
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "tc-admin-theme";
const EVENT = "tc-theme-change";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  return set === "dark" || set === "light" ? set : systemTheme();
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode etc.: the switch still works for this page.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeTheme(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener(EVENT, onChange);
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    media.removeEventListener("change", onChange);
  };
}

/** Runs in <head> before the first paint, so a stored choice never flashes the other theme. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;
