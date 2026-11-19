import { apiClient } from "./CoreAPIService";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiEnvelope } from "@/types/api";
import type { LoginRequest, LoginResponseData } from "@/types/auth";

// Login / logout calls. Storing the session is the login screen's job (it first checks the role),
// so this service never writes storage itself.

const AuthService = {
  /** POST /auth/login — 400 invalidCredentials / invalidPassword / userSuspended / userDeleted on failure. */
  login(body: LoginRequest): Promise<ApiEnvelope<LoginResponseData>> {
    return apiClient.post<LoginResponseData, LoginRequest>(API_ENDPOINTS.AUTH.LOGIN, body, { skipAuthRedirect: true });
  },

  /**
   * GET /auth/logout — drops the refresh token server-side. `token` lets the login screen log out a
   * session it decided not to keep (non-admin role) without ever storing it.
   */
  logout(token?: string): Promise<ApiEnvelope<null>> {
    return apiClient.get<null>(API_ENDPOINTS.AUTH.LOGOUT, undefined, { skipAuthRedirect: true, token });
  },
};

export default AuthService;
