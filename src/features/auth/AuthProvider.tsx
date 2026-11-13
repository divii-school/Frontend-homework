"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import "@/lib/auth/session"; // registers token + refresh hooks with the HTTP client
import { authService, type LoginInput } from "@/services/auth";
import { tokenStorage } from "@/lib/auth/tokenStorage";

/** "checking" only on the server / first paint, before browser storage can be read. */
export type AuthStatus = "checking" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  login: (input: LoginInput & { remember: boolean }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const getStatus = (): AuthStatus => (tokenStorage.get() ? "authenticated" : "anonymous");
const getServerStatus = (): AuthStatus => "checking";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const status = useSyncExternalStore(tokenStorage.subscribe, getStatus, getServerStatus);

  const login = useCallback<AuthContextValue["login"]>(async ({ loginId, password, remember }) => {
    const tokens = await authService.login({ loginId, password });
    tokenStorage.set(tokens, remember);
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

  const value = useMemo(() => ({ status, login, logout }), [status, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
