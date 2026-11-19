import { NextResponse, type NextRequest } from "next/server";
import { matchRoute } from "@/config/navigation";
import { decodeJwtPayload, isTokenExpired } from "@/utils/jwt";
import { SESSION_COOKIE_NAME } from "@/utils/session";

// Server-side half of the route guard (the client RouteGuard is the other half).
//  1. No session cookie, or its JWT `exp` has passed → /login?returnTo=<path + query>
//     (an /api/* path gets a JSON 401 instead of the redirect)
//  2. The role inside the JWT is not allowed on this page (src/config/navigation.ts) → /403
// GENERAL_ADMIN module permissions are not inside the JWT, so RouteGuard checks those in the browser.
// The signature is NOT verified here (secret is server-side) — the API rejects a forged token with 401.

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token || isTokenExpired(token)) {
    // An API path is called by fetch(), which would follow the redirect and read the login page as the
    // answer → a JSON 401 instead
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, message: "sessionExpired" }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    if (pathname !== "/") loginUrl.searchParams.set("returnTo", `${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  const route = matchRoute(pathname);
  const role = decodeJwtPayload(token)?.role ?? "";
  if (route && !(route.item.roles as readonly string[]).includes(role)) {
    const forbiddenUrl = request.nextUrl.clone();
    forbiddenUrl.pathname = "/403";
    forbiddenUrl.search = "";
    forbiddenUrl.searchParams.set("from", `${pathname}${search}`);
    return NextResponse.redirect(forbiddenUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals, static files (anything with a dot), the login and 403 pages.
  // /api/upload is left out too: when middleware runs, Next passes on only the first 10 MB of a request
  // body, which would cut a large image. That route checks the session itself (same cookie + `exp` rule).
  matcher: ["/((?!_next/static|_next/image|api/upload|login|403|.*\\..*).*)"],
};
