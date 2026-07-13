import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_SESSION_COOKIE_NAME,
  needsAccessTokenRefresh,
} from "@/features/auth/lib/webSession";

export function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const hasRefreshSession = request.cookies.has(REFRESH_SESSION_COOKIE_NAME);
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;

  if (!hasRefreshSession || !needsAccessTokenRefresh(accessToken)) {
    return NextResponse.next();
  }

  const refreshUrl = new URL("/auth/refresh", request.url);
  refreshUrl.searchParams.set(
    "returnTo",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(refreshUrl);
}

export const config = {
  matcher: [
    "/((?!api|auth/refresh|auth/logout|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
