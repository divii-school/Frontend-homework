import axios, { type AxiosInstance, type AxiosRequestConfig, type Method } from "axios";
import { ApiError, type ApiEnvelope, type ApiErrorBody, type ApiErrorKind } from "@/types/api";
import { getApiMessage } from "@/utils/api-messages";
import { buildLoginUrl, clearSession, readRawSession, readToken } from "@/utils/session";

// The axios wrapper every domain service uses (layer 2 of 3: query-keys/endpoints → service → hook).
//  - base URL from NEXT_PUBLIC_API_BASE_URL (never hardcoded), e.g. https://…/api/v1
//  - the headers the Talking Club API expects on every call + the Bearer token of the session
//  - returns the response envelope `{ success, message, data, totalRecords?, … }` as-is
//  - every failure becomes one typed ApiError { status, kind, messageKey, message, fieldErrors? }
//  - 401 (or a session whose JWT `exp` has passed) → clear the session and go to
//    /login?returnTo=<current path + query>; login itself opts out with { skipAuthRedirect: true }

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const REQUEST_TIMEOUT_MS = 20_000;

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "accept-language": "en",
  "x-talking-club-platform": "web",
  "x-talking-club-version": "1.0.0",
} as const;

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  /** Don't redirect to /login on 401 (login form, logout call). */
  skipAuthRedirect?: boolean;
  /** Use this token instead of the stored session (e.g. logging out a session we didn't keep). */
  token?: string;
  /** Cancels the request (TanStack Query passes one to every queryFn). */
  signal?: AbortSignal;
}

let redirectingToLogin = false;

/** Clears the session and sends the browser to /login?returnTo=… (once, even if many calls fail together). */
export function redirectToLogin(): void {
  clearSession();
  if (typeof window === "undefined" || redirectingToLogin) return;
  if (window.location.pathname.startsWith("/login")) return;
  redirectingToLogin = true;
  window.location.assign(buildLoginUrl());
}

/** Drops undefined / null / "" so "no filter" never reaches the API as `search=`. */
export function cleanParams(params: QueryParams | undefined): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const result: Record<string, string | number | boolean> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    result[key] = value;
  });
  return result;
}

class CoreAPIService {
  private readonly http: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.http = axios.create({ baseURL, timeout: REQUEST_TIMEOUT_MS, headers: { ...DEFAULT_HEADERS } });
  }

  get<T>(url: string, params?: QueryParams, options?: RequestOptions): Promise<ApiEnvelope<T>> {
    return this.request<T>("GET", url, { params: cleanParams(params) }, options);
  }

  post<T, B = unknown>(url: string, body?: B, options?: RequestOptions): Promise<ApiEnvelope<T>> {
    return this.request<T>("POST", url, { data: body }, options);
  }

  put<T, B = unknown>(url: string, body?: B, options?: RequestOptions): Promise<ApiEnvelope<T>> {
    return this.request<T>("PUT", url, { data: body }, options);
  }

  /** DELETE with an optional JSON body (bulk delete sends `{ ids }`). */
  delete<T, B = unknown>(url: string, body?: B, options?: RequestOptions): Promise<ApiEnvelope<T>> {
    return this.request<T>("DELETE", url, { data: body }, options);
  }

  private async request<T>(
    method: Method,
    url: string,
    config: Pick<AxiosRequestConfig, "params" | "data">,
    options: RequestOptions = {},
  ): Promise<ApiEnvelope<T>> {
    if (!API_BASE_URL) {
      throw new ApiError({
        status: 0,
        kind: "network",
        messageKey: "missingApiBaseUrl",
        message: "NEXT_PUBLIC_API_BASE_URL is not set. Copy .env.example to .env.local and fill it in.",
      });
    }

    const token = options.token ?? readToken();
    // A stored session whose JWT has expired: don't even call the API, go to login
    if (!token && readRawSession() && !options.skipAuthRedirect) {
      redirectToLogin();
      throw new ApiError({ status: 401, kind: "unauthorized", messageKey: "sessionExpired", message: getApiMessage("sessionExpired") });
    }

    try {
      const response = await this.http.request<ApiEnvelope<T>>({
        method,
        url,
        ...config,
        signal: options.signal,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return response.data;
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === "unauthorized" && !options.skipAuthRedirect) redirectToLogin();
      throw apiError;
    }
  }
}

/** First word of a class-validator sentence is the field: "images must contain …" → images. */
function fieldFromSentence(sentence: string): string | null {
  const match = /^([A-Za-z][\w.]*)\s/.exec(sentence);
  return match ? match[1] : null;
}

export function kindFromStatus(status: number, messageKey: string): ApiErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404 || /NotFound$/.test(messageKey)) return "not-found"; // backend sends *NotFound as 400
  if (status >= 500 || status === 429) return "server";
  return "validation";
}

/** Folds any thrown value (axios error, ApiError, anything) into ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    if (axios.isCancel(error)) {
      return new ApiError({ status: 0, kind: "network", messageKey: "requestCancelled", message: "The request was cancelled." });
    }
    if (!error.response) {
      const timedOut = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
      const key = timedOut ? "requestTimeout" : "networkError";
      return new ApiError({ status: 0, kind: "network", messageKey: key, message: getApiMessage(key) });
    }

    const status = error.response.status;
    const body = (error.response.data ?? {}) as ApiErrorBody;
    const raw = body.message;
    let messageKey = "";
    let fieldErrors: Record<string, string> | undefined;

    if (typeof raw === "string") {
      messageKey = raw;
    } else if (Array.isArray(raw)) {
      // Default ValidationPipe: ["name should not be empty", "images must contain at least 1 elements"]
      fieldErrors = {};
      raw.forEach((sentence) => {
        const field = typeof sentence === "string" ? fieldFromSentence(sentence) : null;
        if (field && fieldErrors && !fieldErrors[field]) fieldErrors[field] = getApiMessage(sentence);
      });
      messageKey = typeof raw[0] === "string" ? raw[0] : "Validation Error";
    } else if (raw && typeof raw === "object") {
      // GlobalValidationPipe: { name: "name should not be empty" }
      fieldErrors = {};
      Object.entries(raw).forEach(([field, text]) => {
        if (fieldErrors && typeof text === "string") fieldErrors[field] = getApiMessage(text);
      });
      messageKey = Object.values(raw).find((text) => typeof text === "string") ?? "Validation Error";
    } else {
      messageKey = status >= 500 ? "serverError" : status === 404 ? "notFound" : status === 403 ? "forbidden" : "serverError";
    }

    const kind = kindFromStatus(status, messageKey);
    const fallback = kind === "server" ? getApiMessage("serverError") : undefined;
    return new ApiError({
      status,
      kind,
      messageKey,
      message: kind === "server" && status >= 500 ? (fallback ?? getApiMessage(messageKey)) : getApiMessage(messageKey),
      fieldErrors: fieldErrors && Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    });
  }

  const message = error instanceof Error ? error.message : getApiMessage("serverError");
  return new ApiError({ status: 0, kind: "server", messageKey: "clientError", message });
}

/** One shared instance — services import this. */
export const apiClient = new CoreAPIService();

export default CoreAPIService;
