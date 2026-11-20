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
 * - onSessionExpired: called on a 401 for a logged-in request (clear session, go to login, come back)
 *
 * There is no token refresh: the API's refresh token is an httpOnly cookie on .dvconsulting.org,
 * and its CORS (Access-Control-Allow-Origin: *, no credentials) means a browser on our origin can't send it.
 */
export interface AuthHooks {
  getAccessToken: () => string | null;
  onSessionExpired: () => void;
}

let authHooks: AuthHooks = {
  getAccessToken: () => null,
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
  /** Skip the Authorization header and the 401 session-expired handling (login). */
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
    throw new ApiError(0, "네트워크 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해 주세요.");
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
  const token = anonymous ? null : authHooks.getAccessToken();
  const response = await send(path, options, token);

  // Token expired or revoked → session over; login brings the user back to this page.
  if (response.status === 401 && token) {
    authHooks.onSessionExpired();
  }

  const data = await parse(response);
  if (!response.ok) {
    const code = codeFrom(data);
    throw new ApiError(response.status, code ?? `요청을 처리하지 못했습니다. (${response.status})`, code, data);
  }
  return data as T;
}

/** List responses carry paging next to `data`: { data: [...], totalRecords, totalPage, page }. */
export interface PagedResult<T> {
  rows: T[];
  totalRecords: number;
  totalPage: number;
  page: number;
}

/** Rows come back unvalidated (`unknown`); each service parses them with its own schema. */
export async function pagedRequest(path: string, options: RequestOptions = {}): Promise<PagedResult<unknown>> {
  const envelope = await request<ApiEnvelope<unknown> & { totalRecords?: number; totalPage?: number; page?: number }>(path, options);
  const rows = Array.isArray(envelope.data) ? (envelope.data as unknown[]) : [];
  return {
    rows,
    totalRecords: envelope.totalRecords ?? rows.length,
    totalPage: envelope.totalPage ?? 1,
    page: envelope.page ?? 1,
  };
}

/** Same as `request`, but returns only `data` from the API envelope. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const envelope = await request<ApiEnvelope<T>>(path, options);
  return envelope.data;
}
