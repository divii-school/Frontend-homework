import { NextResponse, type NextRequest } from 'next/server';
import { apiHeaders, apiUrl, readRefreshTokenFrom, setRefreshCookie, upstreamUnreachable } from '@/lib/server/talking-club-proxy';

/** POST /api/auth/login → POST {API}/auth/login. Returns the API body unchanged; keeps the refresh token. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  let upstream: Response;
  try {
    upstream = await fetch(apiUrl('/auth/login'), {
      method: 'POST',
      headers: apiHeaders({ 'content-type': 'application/json' }),
      body,
      cache: 'no-store',
    });
  } catch {
    return upstreamUnreachable();
  }
  const payload: unknown = await upstream.json().catch(() => null);
  const res = NextResponse.json(payload, { status: upstream.status });
  const refreshToken = upstream.ok ? readRefreshTokenFrom(upstream) : null;
  if (refreshToken) setRefreshCookie(res, refreshToken);
  return res;
}
