import { NextResponse, type NextRequest } from 'next/server';
import {
  REFRESH_COOKIE,
  apiHeaders,
  apiUrl,
  clearRefreshCookie,
  readRefreshTokenFrom,
  setRefreshCookie,
  upstreamUnreachable,
} from '@/lib/server/talking-club-proxy';

/** POST /api/auth/refresh → GET {API}/auth/get-access-token with our stored refresh token. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ success: false, message: 'Unauthorized', data: null }, { status: 401 });
  }
  let upstream: Response;
  try {
    upstream = await fetch(apiUrl('/auth/get-access-token'), {
      headers: apiHeaders({ cookie: `refreshToken=${refreshToken}` }),
      cache: 'no-store',
    });
  } catch {
    return upstreamUnreachable();
  }
  const payload: unknown = await upstream.json().catch(() => null);
  const res = NextResponse.json(payload, { status: upstream.status });
  if (!upstream.ok) {
    clearRefreshCookie(res);
    return res;
  }
  // The API may rotate the refresh token; keep the newest one.
  const rotated = readRefreshTokenFrom(upstream);
  if (rotated) setRefreshCookie(res, rotated);
  return res;
}
