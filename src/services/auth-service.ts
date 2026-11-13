import axios from 'axios';
import { toApiError } from '@/lib/api/api-error';
import { getAccessToken } from '@/lib/auth/session-storage';
import type { ApiResponse } from '@/types/api';
import type { LoginRequest, LoginResponseData } from '@/types/auth';

/**
 * Login and logout go through our own /api/auth/* routes (same origin), which keep
 * the refresh token in an httpOnly cookie. See src/lib/server/talking-club-proxy.ts.
 */
export const AuthService = {
  async login(body: LoginRequest): Promise<LoginResponseData> {
    try {
      const { data } = await axios.post<ApiResponse<LoginResponseData>>('/api/auth/login', body);
      return data.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async logout(): Promise<void> {
    const token = getAccessToken();
    await axios
      .post('/api/auth/logout', null, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .catch(() => undefined);
  },
};
