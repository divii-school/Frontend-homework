import axios, { AxiosError } from "axios";
import { env } from "@/config/env";
import { API_HEADERS, API_PREFIX, API_TIMEOUT_MS } from "@/constants/api";
import { API_MESSAGES, MESSAGES } from "@/constants/messages";
import { ApiError, type ApiErrorBody, type ApiErrorKind } from "@/types/api";
import { API_ENDPOINTS } from "@/utils/api-integration";
import { clearSession, loginUrlFor, readToken } from "@/utils/session";

/** One axios instance for the whole app. The base URL comes from the env variable, never from code. */
export const apiClient = axios.create({
  baseURL: `${env.apiBaseUrl}${API_PREFIX}`,
  timeout: API_TIMEOUT_MS,
  headers: { "Content-Type": "application/json", ...API_HEADERS },
});

// Every request carries the access token when there is one.
apiClient.interceptors.request.use((config) => {
  const token = readToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token expired or revoked: forget the session and go to login, remembering the page to come back to.
// The login call itself is left alone so the form can show "wrong ID or password".
apiClient.interceptors.response.use(undefined, (error: unknown) => {
  const isLoginCall = error instanceof AxiosError && error.config?.url === API_ENDPOINTS.auth.login;
  if (error instanceof AxiosError && error.response?.status === 401 && !isLoginCall && typeof window !== "undefined") {
    clearSession();
    window.location.assign(loginUrlFor(window.location.pathname + window.location.search));
  }
  return Promise.reject(toApiError(error));
});

// The API answers a missing record with 400 and one of these keys, not with 404.
const NOT_FOUND_KEYS = new Set(["productNotFound", "categoryNotFound"]);

function kindOf(status: number, code: string | null): ApiErrorKind {
  if (code && NOT_FOUND_KEYS.has(code)) return "not-found";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";
  if (status >= 500) return "server";
  if (status === 400 || status === 422) return "validation";
  return "unknown";
}

const isErrorBody = (value: unknown): value is ApiErrorBody =>
  typeof value === "object" && value !== null && "message" in value && "statusCode" in value;

/** Turn whatever axios threw into an ApiError whose messages a user can read. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!(error instanceof AxiosError)) {
    return new ApiError({ status: 0, kind: "unknown", code: null, messages: [MESSAGES.unknown] });
  }
  if (!error.response) {
    return new ApiError({ status: 0, kind: "network", code: null, messages: [MESSAGES.network] });
  }

  const status = error.response.status;
  const body: unknown = error.response.data;
  if (!isErrorBody(body)) {
    const kind = kindOf(status, null);
    return new ApiError({ status, kind, code: null, messages: [kind === "server" ? MESSAGES.server : MESSAGES.unknown] });
  }

  // Validation errors arrive as a list of sentences; everything else is one message key.
  if (Array.isArray(body.message)) {
    return new ApiError({ status, kind: "validation", code: null, messages: body.message });
  }
  const code = body.message;
  const fallback = status >= 500 ? MESSAGES.server : code;
  return new ApiError({ status, kind: kindOf(status, code), code, messages: [API_MESSAGES[code] ?? fallback] });
}
