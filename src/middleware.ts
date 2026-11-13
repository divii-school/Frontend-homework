import { NextResponse, type NextRequest } from 'next/server';
import { ROUTES, isPublicPath } from '@/config/app-routes';
import { ACCESS_TOKEN_COOKIE, secondsUntilExpiry } from '@/lib/auth/session-storage';
import { safeReturnTo } from '@/lib/auth/return-to';

/**
 * Runs on the server before every page (see `matcher`).
 * Step 1 of the route guard: "is anyone logged in?"
 *  - no live token on a protected page → /login?returnTo=<page>
 *  - live token on /login              → back to returnTo, or the home page
 * Step 2, "may THIS user open THIS page?", needs the permissions, which live in the
 * browser; <RouteGuard> does it with the same config (app-routes.ts).
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const loggedIn = Boolean(token) && secondsUntilExpiry(token as string) > 0;

  if (isPublicPath(pathname)) {
    if (loggedIn && pathname === ROUTES.login) {
      const target = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  if (!loggedIn) {
    const login = new URL(ROUTES.login, request.url);
    if (pathname !== '/') login.searchParams.set('returnTo', `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (pathname === '/') return NextResponse.redirect(new URL(ROUTES.home, request.url));
  return NextResponse.next();
}

export const config = {
  // Everything except our API routes, Next internals and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
};
