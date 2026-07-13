import { normalizeReturnTo } from "@/features/auth/lib/webSession";
import { NextRequest, NextResponse } from "next/server";
import { copySetCookieHeaders, requestWebAuth } from "../_lib/webAuthProxy";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const returnTo = normalizeReturnTo(
    request.nextUrl.searchParams.get("returnTo"),
  );
  const backendResponse = await requestWebAuth(request, "/auth/web/refresh");
  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);

  const copiedCookieCount = copySetCookieHeaders(backendResponse, response);
  if (!backendResponse.ok && copiedCookieCount === 0) {
    return new NextResponse(null, { status: backendResponse.status });
  }

  return response;
}

export async function POST(request: NextRequest) {
  const backendResponse = await requestWebAuth(request, "/auth/web/refresh");
  const response = new NextResponse(null, {
    status: backendResponse.ok ? 204 : 401,
  });

  copySetCookieHeaders(backendResponse, response);
  return response;
}
