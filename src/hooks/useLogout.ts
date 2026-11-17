"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import AuthService from "@/api-services/AuthService";
import { clearAllDrafts } from "@/components/products/form/product-form-draft";
import { beginLogout, clearSession } from "@/utils/session";

/**
 * Logout: GET /auth/logout (drops the server refresh token), then clear the session, the product
 * form drafts of this tab and cached data and go to /login. The local session is cleared even when
 * the API call fails (offline, expired token) — the user asked to leave.
 * A 401 / expiry does not come here (redirectToLogin), so the same user still gets a draft back.
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    beginLogout();
    try {
      await AuthService.logout();
    } catch {
      // ignore — the local session is removed below either way
    }
    clearSession();
    clearAllDrafts();
    queryClient.clear();
    router.replace("/login");
  }, [queryClient, router]);

  return { logout, isLoggingOut };
}
