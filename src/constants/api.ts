export const API_PREFIX = "/api/v1";
export const API_TIMEOUT_MS = 20_000;
/** An image upload passes through two servers, so it gets more time than an ordinary call. */
export const UPLOAD_TIMEOUT_MS = 60_000;
export const QUERY_STALE_MS = 30_000;
/** A read that got no answer or a 5xx is tried once more after a short pause. Writes are never repeated. */
export const QUERY_RETRY_COUNT = 1;
export const QUERY_RETRY_DELAY_MS = 1_000;

/** Headers the Talking Club API requires on every call. */
export const API_HEADERS = {
  "accept-language": "ko",
  "x-talking-club-platform": "web",
  "x-talking-club-version": "1.0.0",
} as const;
