import type { ApiEnvelope } from "@/types/api";
import type { LoginRequest, LoginResponse } from "@/types/auth";
import { apiClient } from "@/utils/api-client";
import { API_ENDPOINTS } from "@/utils/api-integration";

/** Login and logout. Errors are already ApiError (see utils/api-client.ts). */
export const AuthService = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<ApiEnvelope<LoginResponse>>(API_ENDPOINTS.auth.login, request);
    return data.data;
  },

  async logout(): Promise<void> {
    await apiClient.get(API_ENDPOINTS.auth.logout);
  },
};
