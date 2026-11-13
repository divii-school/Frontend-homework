'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/services/auth-service';
import { clearSession, getAccessToken, getStoredUser, saveSession, secondsUntilExpiry } from '@/lib/auth/session-storage';
import { hasPermission } from '@/lib/auth/permissions';
import type { PermissionKey } from '@/config/app-routes';
import type { AuthUser, LoginRequest } from '@/types/auth';

interface AuthContextValue {
  /** Logged-in user, or null. */
  user: AuthUser | null;
  /** False until the stored session has been read on the client (avoids a flash of the wrong UI). */
  ready: boolean;
  login: (body: LoginRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  can: (permission: PermissionKey) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Holds the logged-in user for the whole app. Data from the API stays in TanStack Query. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // Restore the session once, in the browser (localStorage/cookies do not exist on the server).
  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (token && stored && secondsUntilExpiry(token) > 0) setUser(stored);
    else if (stored) clearSession();
    setReady(true);
  }, []);

  const login = useCallback(async (body: LoginRequest) => {
    const result = await AuthService.login(body);
    saveSession(result.token, result.user);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await AuthService.logout();
    clearSession();
    queryClient.clear(); // nothing from this session may be shown to the next user
    setUser(null);
  }, [queryClient]);

  const can = useCallback((permission: PermissionKey) => hasPermission(user, permission), [user]);

  const value = useMemo(() => ({ user, ready, login, logout, can }), [user, ready, login, logout, can]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
