import { NextResponse, type NextRequest } from "next/server";
import { REDIRECT_PARAM, TOKEN_COOKIE } from "@/constants/auth";
import { PUBLIC_PATHS, ROUTES } from "@/constants/routes";
import { isTokenValid } from "@/utils/session";

/**
 * Runs on the server before a page is rendered. It answers one question only: is there a token that has not expired?
 * - no  -> go to login and remember the page that was asked for (?redirect=…), so login can return to it;
 * - yes -> continue. On the login page a signed-in user is sent on to the app.
 * WHAT the user may open (role and permissions) is decided in the browser by RouteGuard, from config/navigation.ts.
 * The token's signature is not checked here; the API checks it on every call and answers 401 for a forged one.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = isTokenValid(request.cookies.get(TOKEN_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!signedIn && !isPublic) {
    const loginUrl = new URL(ROUTES.login, request.url);
    loginUrl.searchParams.set(REDIRECT_PARAM, pathname + search);
    return NextResponse.redirect(loginUrl);
  }
  if (signedIn && isPublic) {
    return NextResponse.redirect(new URL(ROUTES.home, request.url));
  }
  return NextResponse.next();
}

// Every page except Next.js internals, static files and the app's own route handlers (they answer 401 themselves).
export const config = { matcher: ["/((?!_next/|api/|assets/|favicon.ico).*)"] };
