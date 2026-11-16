"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import "@/lib/auth/session"; // registers the token + session-expired hooks with the HTTP client
import { authService, type LoginInput } from "@/services/auth";
import { tokenStorage } from "@/lib/auth/tokenStorage";
import { isAdminRole } from "@/config/navigation";
import type { SessionUser } from "@/types/auth";

/** "checking" only on the server / first paint, before browser storage can be read. */
export type AuthStatus = "checking" | "authenticated" | "anonymous";

/** Thrown by login() when the account is valid but has no admin role (Figma "권한없음" popup). */
export class NotAdminError extends Error {
  constructor() {
    super("This account has no admin permission.");
    this.name = "NotAdminError";
  }
}

interface AuthContextValue {
  status: AuthStatus;
  user: SessionUser | null;
  login: (input: LoginInput & { remember: boolean }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SERVER = "__server__";
const getSnapshot = (): string | null => tokenStorage.snapshot();
const getServerSnapshot = (): string => SERVER;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const raw = useSyncExternalStore(tokenStorage.subscribe, getSnapshot, getServerSnapshot);

  const session = useMemo(() => (raw === SERVER ? null : tokenStorage.parse(raw)), [raw]);
  const status: AuthStatus = raw === SERVER ? "checking" : session ? "authenticated" : "anonymous";

  const login = useCallback<AuthContextValue["login"]>(async ({ loginId, password, remember }) => {
    const result = await authService.login({ loginId, password });
    if (!isAdminRole(result.user.role)) {
      // Valid account but not an admin: end the server session and don't keep the token.
      await authService.logoutWith(result.accessToken).catch(() => undefined);
      throw new NotAdminError();
    }
    tokenStorage.set(result, remember);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Log out locally even if the API call fails.
    }
    tokenStorage.clear();
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ status, user: session?.user ?? null, login, logout }),
    [status, session, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
