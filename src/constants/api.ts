export const API_PREFIX = "/api/v1";
export const API_TIMEOUT_MS = 20_000;
export const QUERY_STALE_MS = 30_000;

/** Headers the Talking Club API requires on every call. */
export const API_HEADERS = {
  "accept-language": "ko",
  "x-talking-club-platform": "web",
  "x-talking-club-version": "1.0.0",
} as const;
