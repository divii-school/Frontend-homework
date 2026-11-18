/**
 * `hw3_session=1`: "this browser holds a refresh token", nothing more (no token, no user data).
 *
 * The refresh token cookie is scoped to /api/auth, so middleware.ts never sees it on a page
 * request. This marker has the same lifetime but covers every path, so the middleware can tell
 * "access token expired, but the session can be renewed" (자동 로그인) from "logged out".
 * Set and cleared together with the refresh token in lib/server/talking-club-proxy.ts.
 */
export const SESSION_MARKER_COOKIE = 'hw3_session';
