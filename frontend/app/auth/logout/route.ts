import { NextRequest, NextResponse } from "next/server";
import { copySetCookieHeaders, requestWebAuth } from "../_lib/webAuthProxy";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const backendResponse = await requestWebAuth(request, "/auth/logout");
  if (!backendResponse.ok) {
    return new NextResponse(null, { status: backendResponse.status });
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);

  copySetCookieHeaders(backendResponse, response);
  return response;
}
