import { env } from "@/lib/env";
import type { ApiEnvelope } from "@/types/api";

/** Error thrown for any non-2xx response or network failure. `status` is 0 for network errors. */
export class ApiError extends Error {
  readonly status: number;
  /** Raw `message` from the API envelope (often a code such as "invalidCredentials"). */
  readonly code: string | null;
  readonly body: unknown;

  constructor(status: number, message: string, code: string | null = null, body: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

/**
 * The auth layer plugs in here, so this module never imports auth code:
 * - getAccessToken: current access token (or null)
 * - refreshAccessToken: get a new access token, or null if the session is over
 * - onSessionExpired: called once when refresh fails (clear session, go to login)
 */
export interface AuthHooks {
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
  onSessionExpired: () => void;
}

let authHooks: AuthHooks = {
  getAccessToken: () => null,
  refreshAccessToken: async () => null,
  onSessionExpired: () => {},
};

export function registerAuthHooks(hooks: AuthHooks): void {
  authHooks = hooks;
}

type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Query;
  /** Plain object → JSON. FormData is sent as multipart. */
  body?: unknown;
  signal?: AbortSignal;
  /** Skip the Authorization header and the 401 refresh (login, refresh itself). */
  anonymous?: boolean;
  headers?: Record<string, string>;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${env.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function codeFrom(body: unknown): string | null {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === "string" && message) return message;
    if (Array.isArray(message) && message.length) return message.map(String).join("\n");
  }
  return null;
}

async function send(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const { method = "GET", query, body, signal, headers = {} } = options;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    "accept-language": "en",
    "x-talking-club-platform": "web",
    ...headers,
  };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  try {
    return await fetch(buildUrl(path, query), { method, headers: finalHeaders, body: payload, signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "Network error. Check your connection and try again.");
  }
}

async function parse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Sends a request and returns the parsed JSON body (the whole envelope). */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const anonymous = options.anonymous ?? false;
  let response = await send(path, options, anonymous ? null : authHooks.getAccessToken());

  // Access token expired → refresh once and retry. If refresh fails, the session is over.
  if (response.status === 401 && !anonymous && authHooks.getAccessToken()) {
    const newToken = await authHooks.refreshAccessToken();
    if (newToken) {
      response = await send(path, options, newToken);
    } else {
      authHooks.onSessionExpired();
    }
  }

  const data = await parse(response);
  if (!response.ok) {
    const code = codeFrom(data);
    throw new ApiError(response.status, code ?? `Request failed (${response.status})`, code, data);
  }
  return data as T;
}

/** Same as `request`, but returns only `data` from the API envelope. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const envelope = await request<ApiEnvelope<T>>(path, options);
  return envelope.data;
}
