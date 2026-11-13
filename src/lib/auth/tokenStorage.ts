/**
 * Where the tokens live in the browser.
 * "Auto login" checked → localStorage (survives closing the browser).
 * Unchecked → sessionStorage (cleared when the tab/browser closes).
 */
export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

const KEY = "tc-admin-auth";

// Small store so React can subscribe (useSyncExternalStore) to login/logout.
const listeners = new Set<() => void>();
function emit(): void {
  listeners.forEach((listener) => listener());
}

function read(storage: Storage): StoredTokens | null {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<StoredTokens>;
    if (typeof value.accessToken === "string" && typeof value.refreshToken === "string") {
      return { accessToken: value.accessToken, refreshToken: value.refreshToken };
    }
  } catch {
    // Storage blocked or corrupted value → treat as logged out.
  }
  return null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
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

  get(): StoredTokens | null {
    if (!isBrowser()) return null;
    return read(window.sessionStorage) ?? read(window.localStorage);
  },

  /** Saves tokens. `remember` picks localStorage over sessionStorage. */
  set(tokens: StoredTokens, remember: boolean): void {
    if (!isBrowser()) return;
    removeAll();
    try {
      (remember ? window.localStorage : window.sessionStorage).setItem(KEY, JSON.stringify(tokens));
    } catch {
      // Private mode / quota: the login can't be kept.
    }
    emit();
  },

  /** Replaces the access token in whichever storage holds the session. */
  updateAccessToken(accessToken: string): void {
    if (!isBrowser()) return;
    for (const storage of [window.sessionStorage, window.localStorage]) {
      const current = read(storage);
      if (current) {
        try {
          storage.setItem(KEY, JSON.stringify({ ...current, accessToken }));
        } catch {
          // ignore
        }
        return;
      }
    }
  },

  clear(): void {
    if (!isBrowser()) return;
    removeAll();
    emit();
  },
};

function removeAll(): void {
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      storage.removeItem(KEY);
    } catch {
      // ignore
    }
  }
}
