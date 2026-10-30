import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const APP_ROUTES = ["/home", "/tasks", "/schedule", "/inventory", "/vendors", "/settings"];

/**
 * Optimistic redirect based on the session cookie only (no DB lookup). Pages still verify the
 * session with `requireSession()` / `getCurrentHome()`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = Boolean(getSessionCookie(request));

  if (pathname === "/") {
    // `?expired=1` comes from requireSession(): the cookie is stale, so show the landing page.
    const expired = request.nextUrl.searchParams.has("expired");
    return signedIn && !expired ? NextResponse.redirect(new URL("/home", request.url)) : NextResponse.next();
  }
  const isAppRoute = APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isAppRoute && !signedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/home/:path*",
    "/tasks/:path*",
    "/schedule/:path*",
    "/inventory/:path*",
    "/vendors/:path*",
    "/settings/:path*",
  ],
};
