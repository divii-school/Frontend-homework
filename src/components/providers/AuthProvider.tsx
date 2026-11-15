"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser } from "@/types/auth";
import { clearSession, isTokenValid, readStoredUser, readToken, saveSession } from "@/utils/session";

interface AuthContextValue {
  /** The signed-in user, or null. */
  user: AuthUser | null;
  /** False until the browser storage has been read. Screens wait for it before deciding "not signed in". */
  ready: boolean;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Who is signed in, for the whole app (menu, route guard, buttons).
 * The user comes from the login response and is kept in localStorage; the token is kept in a cookie.
 * Storage can only be read in the browser, so the first render has no user and `ready` is false.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // A stored user without a valid token is a leftover from an expired session: ignore it.
    setUser(isTokenValid(readToken()) ? readStoredUser() : null);
    setReady(true);
  }, []);

  const signIn = useCallback((token: string, nextUser: AuthUser) => {
    saveSession(token, nextUser);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, signOut }), [user, ready, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
