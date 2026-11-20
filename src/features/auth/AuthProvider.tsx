'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { onSessionExpired } from '@/lib/api/client';
import { tokenStore } from '@/lib/auth/tokenStore';
import { can, type Permission } from '@/config/access';
import { authService, type AdminProfile, type LoginInput } from './authService';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: Status;
  profile: AdminProfile | null;
  login: (input: LoginInput, persist: boolean) => Promise<AdminProfile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function loginUrlWithReturn(pathname: string, search: string): string {
  const returnTo = `${pathname}${search ? `?${search}` : ''}`;
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Restore the session on first load.
  useEffect(() => {
    if (!tokenStore.getAccessToken()) {
      setStatus('anonymous');
      return;
    }
    authService
      .profile()
      .then((p) => {
        setProfile(p);
        setStatus('authenticated');
      })
      .catch(() => {
        tokenStore.clear();
        setStatus('anonymous');
      });
  }, []);

  // Refresh failed → back to login, remembering the current page.
  useEffect(
    () =>
      onSessionExpired(() => {
        setProfile(null);
        setStatus('anonymous');
        queryClient.clear();
        if (pathname !== '/login') router.replace(loginUrlWithReturn(pathname, searchParams.toString()));
      }),
    [pathname, searchParams, router, queryClient],
  );

  const login = useCallback(async (input: LoginInput, persist: boolean) => {
    tokenStore.clear();
    tokenStore.setPersist(persist);
    const session = await authService.login(input);
    tokenStore.setTokens(session.accessToken, session.refreshToken);
    const p = await authService.profile();
    setProfile(p);
    setStatus('authenticated');
    return p;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      /* token may already be invalid; clear locally anyway */
    }
    tokenStore.clear();
    queryClient.clear();
    setProfile(null);
    setStatus('anonymous');
    router.replace('/login');
  }, [queryClient, router]);

  const value = useMemo(() => ({ status, profile, login, logout }), [status, profile, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** Button-level permission check, reading the same config as menu and guard. */
export function useCan(permission: Permission): boolean {
  const { profile } = useAuth();
  return can(profile?.role, permission);
}
