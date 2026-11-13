import { NextResponse, type NextRequest } from 'next/server';
import { REFRESH_COOKIE, apiHeaders, apiUrl, clearRefreshCookie } from '@/lib/server/talking-club-proxy';

/** POST /api/auth/logout → GET {API}/auth/logout, then forget the refresh token. Always succeeds locally. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const authorization = request.headers.get('authorization');
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const headers = apiHeaders({
    ...(authorization ? { authorization } : {}),
    ...(refreshToken ? { cookie: `refreshToken=${refreshToken}` } : {}),
  });
  // Logging out locally must not depend on the API being up.
  await fetch(apiUrl('/auth/logout'), { headers, cache: 'no-store' }).catch(() => undefined);
  const res = NextResponse.json({ success: true, message: 'logoutSuccess', data: null });
  clearRefreshCookie(res);
  return res;
}
