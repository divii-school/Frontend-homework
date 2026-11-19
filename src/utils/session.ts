import type { AuthUser, Session } from "@/types/auth";
import { getTokenExpiryMs, isTokenExpired } from "@/utils/jwt";

// Where the login session lives in the browser.
//
// Two copies, two jobs:
//  1. Web storage (`tc_hw3_session` = { token, user, remember }) — read by the app: CoreAPIService
//     attaches the token, the sidebar / guards read the user and role.
//  2. Cookie `tc_hw3_token` (NOT httpOnly, the browser writes it) — read only by src/middleware.ts,
//     which runs on the server and cannot see web storage. It lets an unauthenticated request to a
//     protected URL be redirected to /login?returnTo=… before any page code is sent.
//
// "Auto login" (design 1.1.0 ③):
//  - ticked   → localStorage + a cookie with Max-Age = the token's remaining lifetime, so the session
//               survives closing the browser until the JWT expires (1 day on the QA server).
//  - unticked → sessionStorage + a session cookie (no Max-Age): both are gone when the browser
//               (sessionStorage: the tab) is closed. A new tab therefore asks to log in again.
// The QA API answers CORS `origin:*` without credentials, so the httpOnly refresh-token cookie it sets
// can't be used from this origin — there is no silent refresh; an expired token means log in again.
//
// Every storage access is wrapped in try/catch: storage can be blocked (private mode, policies).

export const SESSION_STORAGE_KEY = "tc_hw3_session";
export const SESSION_COOKIE_NAME = "tc_hw3_token";
const SESSION_CHANGE_EVENT = "tc-hw3-session-change";

type StorageKind = "local" | "session";

// Set while the user is logging out on purpose, so AuthGate sends them to plain /login
// instead of /login?returnTo=<the page they were on>.
let logoutInProgress = false;

export function beginLogout(): void {
  logoutInProgress = true;
}

export function isLogoutInProgress(): boolean {
  return logoutInProgress;
}

function getStorage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function readRaw(kind: StorageKind): string | null {
  try {
    return getStorage(kind)?.getItem(SESSION_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function removeRaw(kind: StorageKind): void {
  try {
    getStorage(kind)?.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // storage blocked — nothing stored there either
  }
}

/** Raw stored session string (sessionStorage first, then localStorage). Stable for useSyncExternalStore. */
export function readRawSession(): string | null {
  return readRaw("session") ?? readRaw("local");
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<AuthUser>;
  return typeof user.role === "string" && typeof user.fullName === "string" && Array.isArray(user.permissions);
}

/** Parses a stored session string; null when missing, malformed or the token has expired. */
export function parseSession(raw: string | null, now: number = Date.now()): Session | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<Session>;
    if (typeof candidate.token !== "string" || !isAuthUser(candidate.user)) return null;
    if (isTokenExpired(candidate.token, now)) return null;
    return { token: candidate.token, user: candidate.user, remember: candidate.remember === true };
  } catch {
    return null;
  }
}

/** The current valid session, or null. */
export function readSession(): Session | null {
  return parseSession(readRawSession());
}

/** Bearer token of the current valid session, or null. */
export function readToken(): string | null {
  return readSession()?.token ?? null;
}

function writeCookie(token: string | null, remember: boolean): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  if (!token) {
    document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    return;
  }
  const expiry = getTokenExpiryMs(token);
  const maxAge = remember && expiry ? `; Max-Age=${Math.max(0, Math.floor((expiry - Date.now()) / 1000))}` : "";
  document.cookie = `${SESSION_COOKIE_NAME}=${token}; Path=/; SameSite=Lax${maxAge}${secure}`;
}

function notifyChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

/** Stores the session after a successful login (see "Auto login" above). */
export function saveSession(token: string, user: AuthUser, remember: boolean): void {
  const session: Session = { token, user, remember };
  logoutInProgress = false;
  removeRaw("local");
  removeRaw("session");
  try {
    getStorage(remember ? "local" : "session")?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage blocked — the cookie still lets the middleware through, but the app will ask to log in
  }
  writeCookie(token, remember);
  notifyChange();
}

/** Removes the session everywhere (logout, 401, expiry). */
export function clearSession(): void {
  removeRaw("local");
  removeRaw("session");
  writeCookie(null, false);
  notifyChange();
}

/** Subscribe to session changes in this tab (custom event) and other tabs (storage event). */
export function subscribeSession(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === SESSION_STORAGE_KEY) onChange();
  };
  window.addEventListener(SESSION_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SESSION_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Builds `/login?returnTo=<path+query>` for the current page (or a given path). */
export function buildLoginUrl(returnTo?: string): string {
  const target =
    returnTo ?? (typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "");
  if (!target || target === "/" || target.startsWith("/login")) return "/login";
  return `/login?returnTo=${encodeURIComponent(target)}`;
}

/**
 * Only same-site relative paths are allowed as `returnTo` (no open redirect):
 * must start with a single "/", no "//" or "/\", no scheme, not the login page itself.
 */
export function sanitizeReturnTo(value: string | null | undefined): string | null {
  if (!value) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  // Check the value as given AND once more decoded, so "%2F%2Fevil.com" can't sneak through
  for (const candidate of [value, decoded]) {
    if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/\\")) return null;
    if (candidate.includes("://")) return null;
    for (let index = 0; index < candidate.length; index += 1) {
      if (candidate.charCodeAt(index) < 32) return null; // control characters (tabs / newlines)
    }
  }
  const path = value.split(/[?#]/)[0];
  if (path === "/login" || path.startsWith("/login/")) return null;
  return value;
}
