import { env } from "@/lib/env";

/** Error thrown for any non-2xx response or network failure. `status` is 0 for network errors. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type TokenGetter = () => string | null;

let getAccessToken: TokenGetter = () => null;

/** The auth layer registers how to read the current access token. */
export function setAccessTokenGetter(getter: TokenGetter): void {
  getAccessToken = getter;
}

type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Query;
  /** Plain object → JSON. FormData is sent as multipart. */
  body?: unknown;
  signal?: AbortSignal;
  /** Skip the Authorization header (login, refresh). */
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

function messageFrom(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === "string" && message) return message;
    if (Array.isArray(message) && message.length) return message.map(String).join("\n");
  }
  return fallback;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", query, body, signal, anonymous = false, headers = {} } = options;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    "accept-language": "en",
    "x-talking-club-platform": "web",
    ...headers,
  };

  const token = anonymous ? null : getAccessToken();
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), { method, headers: finalHeaders, body: payload, signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "Network error. Check your connection and try again.");
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, messageFrom(data, `Request failed (${response.status})`), data);
  }

  return data as T;
}
