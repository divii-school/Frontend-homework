import { NextResponse, type NextRequest } from 'next/server';
import { apiHeaders, apiUrl, readRefreshTokenFrom, setRefreshCookie, upstreamUnreachable } from '@/lib/server/talking-club-proxy';
import type { LoginFormValues } from '@/types/auth';

/**
 * POST /api/auth/login → POST {API}/auth/login.
 * Sends only { loginId, password } upstream, returns the API body unchanged,
 * and keeps the refresh token in our httpOnly cookie (persistent only with 자동 로그인).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as Partial<LoginFormValues> | null;
  const credentials = { loginId: body?.loginId ?? '', password: body?.password ?? '' };
  let upstream: Response;
  try {
    upstream = await fetch(apiUrl('/auth/login'), {
      method: 'POST',
      headers: apiHeaders({ 'content-type': 'application/json' }),
      body: JSON.stringify(credentials),
      cache: 'no-store',
    });
  } catch {
    return upstreamUnreachable();
  }
  const payload: unknown = await upstream.json().catch(() => null);
  const res = NextResponse.json(payload, { status: upstream.status });
  const refreshToken = upstream.ok ? readRefreshTokenFrom(upstream) : null;
  if (refreshToken) setRefreshCookie(res, refreshToken, body?.remember === true);
  return res;
}
