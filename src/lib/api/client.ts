import { tokenStore } from '@/lib/auth/tokenStore';
import { pickString, unwrapData } from './normalize';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
export const API_PREFIX = '/api/v1';

/** Headers every Talking Club endpoint requires (see Swagger). */
const COMMON_HEADERS: Record<string, string> = {
  'accept-language': 'ko',
  'x-talking-club-platform': 'web',
  'x-talking-club-version': '1.0.0',
};

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/** Korean fallback messages per HTTP status (WM error message format). */
export function statusMessage(status: number): string {
  switch (status) {
    case 0:
      return '네트워크 연결을 확인해 주세요.';
    case 400:
      return '입력값을 다시 확인해 주세요.';
    case 401:
      return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
    case 403:
      return '접근 권한이 없습니다.';
    case 404:
      return '요청한 정보를 찾을 수 없습니다.';
    case 409:
      return '이미 존재하는 데이터입니다.';
    default:
      return status >= 500
        ? '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
        : '요청을 처리하지 못했습니다.';
  }
}

function extractMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    const raw = (body as Record<string, unknown>).message;
    if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0];
    if (typeof raw === 'string' && raw.trim()) return raw;
  }
  return statusMessage(status);
}

type Listener = () => void;
const sessionExpiredListeners = new Set<Listener>();
/** AuthProvider subscribes so a failed refresh sends the user to /login?returnTo=... */
export function onSessionExpired(fn: Listener): () => void {
  sessionExpiredListeners.add(fn);
  return () => sessionExpiredListeners.delete(fn);
}

let refreshing: Promise<boolean> | null = null;

/** GET /auth/get-access-token — the refresh token is sent as the bearer token. */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return false;
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_BASE}${API_PREFIX}/auth/get-access-token`, {
        headers: { ...COMMON_HEADERS, Authorization: `Bearer ${refreshToken}` },
      });
      if (!res.ok) return false;
      const data = unwrapData(await res.json());
      const access = pickString(data, ['accessToken', 'access_token', 'token']);
      if (!access) return false;
      tokenStore.setTokens(access, pickString(data, ['refreshToken', 'refresh_token']) ?? refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => (refreshing = null), 0);
    }
  })();
  return refreshing;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | undefined | null>;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

export function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_BASE}${API_PREFIX}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function apiRequest<T = unknown>(path: string, opts: RequestOptions = {}, retried = false): Promise<T> {
  const { method = 'GET', query, body, auth = true, signal } = opts;
  const headers: Record<string, string> = { ...COMMON_HEADERS };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.getAccessToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(0, statusMessage(0), null);
  }

  if (res.status === 401 && auth && !retried) {
    if (await refreshAccessToken()) return apiRequest<T>(path, opts, true);
    tokenStore.clear();
    sessionExpiredListeners.forEach((fn) => fn());
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) throw new ApiError(res.status, extractMessage(json, res.status), json);
  return json as T;
}

export const api = {
  get: <T = unknown>(path: string, query?: RequestOptions['query'], signal?: AbortSignal) =>
    apiRequest<T>(path, { query, signal }),
  post: <T = unknown>(path: string, body?: unknown, auth = true) => apiRequest<T>(path, { method: 'POST', body, auth }),
  put: <T = unknown>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body }),
  delete: <T = unknown>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'DELETE', body }),
};
