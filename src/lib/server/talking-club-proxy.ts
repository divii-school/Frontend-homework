import 'server-only';
import { NextResponse } from 'next/server';
import { requireApiBaseUrl, talkingClubHeaders } from '@/config/env';

/**
 * Server-side helpers for our /api/* route handlers.
 *
 * Why these routes exist: the QA API sends the refresh token as a cookie on its own
 * domain (.dvconsulting.org) and answers CORS with `Access-Control-Allow-Origin: *`
 * without credentials, so a browser on localhost or *.vercel.app can never send that
 * cookie back. Our routes call the API from the server, keep the refresh token in an
 * httpOnly cookie on OUR domain, and so make token refresh possible.
 */
export const REFRESH_COOKIE = 'hw3_rt';

export function apiUrl(path: string): string {
  return `${requireApiBaseUrl()}/api/v1${path}`;
}

export function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { ...talkingClubHeaders(), ...extra };
}

/** Pulls `refreshToken=<value>` out of the API's Set-Cookie header(s). */
export function readRefreshTokenFrom(response: Response): string | null {
  const cookies = response.headers.getSetCookie();
  for (const cookie of cookies) {
    const match = /(?:^|;\s*)refreshToken=([^;]+)/.exec(cookie);
    if (match) return match[1];
  }
  return null;
}

/** Name of the cookie that remembers 자동 로그인 (no value of its own, just on/off). */
export const REMEMBER_COOKIE = 'hw3_remember';
const SEVEN_DAYS = 60 * 60 * 24 * 7;

/**
 * Stores the refresh token. With 자동 로그인 it survives closing the browser (7 days);
 * without it, it is a session cookie and ends with the browser.
 */
export function setRefreshCookie(res: NextResponse, token: string, remember: boolean): void {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/auth',
    ...(remember ? { maxAge: SEVEN_DAYS } : {}),
  };
  res.cookies.set(REFRESH_COOKIE, token, options);
  res.cookies.set(REMEMBER_COOKIE, remember ? '1' : '0', options);
}

export function clearRefreshCookie(res: NextResponse): void {
  res.cookies.set(REFRESH_COOKIE, '', { httpOnly: true, path: '/api/auth', maxAge: 0 });
  res.cookies.set(REMEMBER_COOKIE, '', { httpOnly: true, path: '/api/auth', maxAge: 0 });
}

/** Body the browser gets when the API cannot be reached at all. */
export function upstreamUnreachable(): NextResponse {
  return NextResponse.json(
    { success: false, message: 'networkError', data: null, errors: null, statusCode: 502 },
    { status: 502 },
  );
}
