/**
 * Tokens live in sessionStorage by default, or localStorage when the user ticks
 * "자동 로그인". Nothing secret is ever written to the repo or to env files.
 */
const ACCESS = 'tc_access_token';
const REFRESH = 'tc_refresh_token';
const PERSIST = 'tc_persist';

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(PERSIST) === '1' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export const tokenStore = {
  getAccessToken(): string | null {
    return storage()?.getItem(ACCESS) ?? null;
  },
  getRefreshToken(): string | null {
    return storage()?.getItem(REFRESH) ?? null;
  },
  setPersist(persist: boolean) {
    try {
      if (persist) window.localStorage.setItem(PERSIST, '1');
      else window.localStorage.removeItem(PERSIST);
    } catch {
      /* storage unavailable */
    }
  },
  setTokens(access: string, refresh?: string | null) {
    const s = storage();
    if (!s) return;
    s.setItem(ACCESS, access);
    if (refresh) s.setItem(REFRESH, refresh);
  },
  clear() {
    try {
      [window.localStorage, window.sessionStorage].forEach((s) => {
        s.removeItem(ACCESS);
        s.removeItem(REFRESH);
      });
      window.localStorage.removeItem(PERSIST);
    } catch {
      /* storage unavailable */
    }
  },
};
