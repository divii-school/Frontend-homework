import type { ApiEnvelope } from "@/types/api";
import type { AuthUser, LoginRequest, LoginResponse } from "@/types/auth";
import { apiClient } from "@/utils/api-client";
import { API_ENDPOINTS } from "@/utils/api-integration";

/** Login, logout and "who am I". Errors are already ApiError (see utils/api-client.ts). */
export const AuthService = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<ApiEnvelope<LoginResponse>>(API_ENDPOINTS.auth.login, request);
    return data.data;
  },

  async logout(): Promise<void> {
    await apiClient.get(API_ENDPOINTS.auth.logout);
  },

  /** The profile has no `permissions`, so the caller keeps the ones it got at login. */
  async profile(): Promise<Omit<AuthUser, "permissions">> {
    const { data } = await apiClient.get<ApiEnvelope<Omit<AuthUser, "permissions">>>(API_ENDPOINTS.auth.profile);
    return data.data;
  },
};
