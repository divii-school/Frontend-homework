import { REDIRECT_PARAM, TOKEN_COOKIE, USER_STORAGE_KEY } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import type { AuthUser } from "@/types/auth";

/** Seconds since 1970 when the JWT stops working, or null when it cannot be read. Works in the browser and in middleware. */
export function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const exp: unknown = JSON.parse(atob(payload)).exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

export function isTokenValid(token: string | undefined, nowMs: number = Date.now()): boolean {
  if (!token) return false;
  const exp = tokenExpiry(token);
  return exp !== null && exp * 1000 > nowMs;
}

export function readToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const entry = document.cookie.split("; ").find((part) => part.startsWith(`${TOKEN_COOKIE}=`));
  return entry ? decodeURIComponent(entry.slice(TOKEN_COOKIE.length + 1)) : undefined;
}

/** Keep the token until it expires. SameSite=Lax: the cookie is only for the pages of this app. */
export function saveSession(token: string, user: AuthUser): void {
  const exp = tokenExpiry(token);
  const maxAge = exp ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : 0;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

export function readStoredUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

/** Only paths inside this app are accepted as a return address ("/products?page=2"), never another site. */
export function safeRedirectPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith(ROUTES.login)) {
    return ROUTES.home;
  }
  return value;
}

/** "/auth/login?redirect=%2Fproducts%3Fpage%3D2" for the page the user is on now. */
export function loginUrlFor(pathWithQuery: string): string {
  return `${ROUTES.login}?${REDIRECT_PARAM}=${encodeURIComponent(pathWithQuery)}`;
}
