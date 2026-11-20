/**
 * Where the login session lives in the browser.
 * "Auto login" checked → localStorage (survives closing the browser).
 * Unchecked → sessionStorage (cleared when the tab/browser closes).
 *
 * Only the access token is stored. The API's refresh token is an httpOnly cookie on
 * .dvconsulting.org that a browser on another origin can't send (the API's CORS has no
 * credentials support), so when the token expires the user logs in again.
 */
import type { SessionUser } from "@/types/auth";

export interface StoredSession {
  accessToken: string;
  user: SessionUser;
}

const KEY = "tc-admin-auth";

// Small store so React can subscribe (useSyncExternalStore) to login/logout.
const listeners = new Set<() => void>();
function emit(): void {
  listeners.forEach((listener) => listener());
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Seconds since epoch from the JWT "exp" claim, or null if it can't be read. */
function jwtExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: unknown };
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

function parse(raw: string | null): StoredSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredSession>;
    const user = value.user;
    if (typeof value.accessToken !== "string" || !user || typeof user.role !== "string") return null;
    const exp = jwtExpiry(value.accessToken);
    if (exp !== null && exp * 1000 <= Date.now()) return null; // expired → logged out
    return { accessToken: value.accessToken, user };
  } catch {
    return null; // corrupted value → logged out
  }
}

function readRaw(storage: Storage): string | null {
  try {
    return storage.getItem(KEY);
  } catch {
    return null; // storage blocked
  }
}

function removeAll(): void {
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      storage.removeItem(KEY);
    } catch {
      // ignore
    }
  }
}

export const tokenStorage = {
  /** Listen for session changes in this tab and in other tabs (storage event). */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY || event.key === null) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },

  /**
   * The stored string itself. A string is a stable snapshot for useSyncExternalStore
   * (a freshly parsed object would be "new" on every render).
   */
  snapshot(): string | null {
    if (!isBrowser()) return null;
    const raw = readRaw(window.sessionStorage) ?? readRaw(window.localStorage);
    return parse(raw) ? raw : null;
  },

  parse,

  get(): StoredSession | null {
    return parse(this.snapshot());
  },

  /** Saves the session. `remember` picks localStorage over sessionStorage. */
  set(session: StoredSession, remember: boolean): void {
    if (!isBrowser()) return;
    removeAll();
    try {
      (remember ? window.localStorage : window.sessionStorage).setItem(KEY, JSON.stringify(session));
    } catch {
      // Private mode / quota: the login can't be kept.
    }
    emit();
  },

  clear(): void {
    if (!isBrowser()) return;
    removeAll();
    emit();
  },
};
