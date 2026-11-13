import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env, talkingClubHeaders } from '@/config/env';
import { ROUTES } from '@/config/app-routes';
import { clearSession, getAccessToken, setAccessToken } from '@/lib/auth/session-storage';
import { toApiError } from './api-error';
import type { ApiResponse } from '@/types/api';
import type { RefreshResponseData } from '@/types/auth';

/**
 * The one axios instance every service uses.
 * Request:  adds the Talking Club headers and `Authorization: Bearer <token>`.
 * Response: on 401 it asks /api/auth/refresh for a new token once and replays the call;
 *           if that fails the session is cleared and the user goes to
 *           /login?returnTo=<this page>, so they come back here after logging in.
 * Every error leaves as an ApiError (see api-error.ts).
 */
export const httpClient = axios.create({
  baseURL: `${env.apiBaseUrl}/api/v1`,
  timeout: 20_000,
});

httpClient.interceptors.request.use((config) => {
  config.headers.set(talkingClubHeaders());
  const token = getAccessToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

/** One refresh at a time: parallel 401s all wait for the same promise. */
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    // Same-origin Next.js route: it holds the refresh token in an httpOnly cookie.
    const { data } = await axios.post<ApiResponse<RefreshResponseData>>('/api/auth/refresh');
    setAccessToken(data.data.token);
    return data.data.token;
  } catch {
    return null;
  }
}

/** Sends the user to login and remembers where they were. */
export function redirectToLogin(): void {
  clearSession();
  const here = `${window.location.pathname}${window.location.search}`;
  const target = here.startsWith(ROUTES.login) ? ROUTES.login : `${ROUTES.login}?returnTo=${encodeURIComponent(here)}&reason=expired`;
  window.location.assign(target);
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      refreshInFlight ??= refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
      const token = await refreshInFlight;
      if (token) {
        original.headers.set('Authorization', `Bearer ${token}`);
        return httpClient(original);
      }
      redirectToLogin();
    }
    return Promise.reject(toApiError(error));
  },
);
