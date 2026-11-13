import type { AuthUser } from '@/types/auth';

/**
 * Where the logged-in session lives in the browser.
 *
 * - Access token → cookie `hw3_at`. A cookie (not localStorage) so `middleware.ts`
 *   can see it on the server and redirect before a protected page renders.
 * - User (name, role, permissions) → localStorage. Only POST /auth/login returns
 *   permissions (GET /admin/profile does not), so we keep the login copy.
 * - Refresh token → httpOnly cookie set by our /api/auth/* routes; JS never sees it.
 */
export const ACCESS_TOKEN_COOKIE = 'hw3_at';
const USER_KEY = 'hw3_user';

/** Seconds until the JWT expires, from its `exp` claim (no signature check, display only). */
export function secondsUntilExpiry(token: string, nowMs: number = Date.now()): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: number;
    };
    return payload.exp ? Math.floor(payload.exp - nowMs / 1000) : 0;
  } catch {
    return 0;
  }
}

export function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(ACCESS_TOKEN_COOKIE.length + 1)) : null;
}

export function setAccessToken(token: string): void {
  const maxAge = Math.max(secondsUntilExpiry(token), 0);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: AuthUser): void {
  setAccessToken(token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.localStorage.removeItem(USER_KEY);
}
