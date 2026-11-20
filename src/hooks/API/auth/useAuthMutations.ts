import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/api-services/AuthService";
import type { ApiError } from "@/types/api";
import type { LoginRequest, LoginResponse } from "@/types/auth";

/** POST /auth/login. The caller saves the session on success. */
export function useLogin() {
  return useMutation<LoginResponse, ApiError, LoginRequest>({ mutationFn: AuthService.login });
}

/** GET /auth/logout, then drop every cached answer so the next user never sees this user's data. */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: AuthService.logout,
    onSettled: () => queryClient.clear(),
  });
}
