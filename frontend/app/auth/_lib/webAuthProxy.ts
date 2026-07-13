import { API_CONFIG } from "@/shared/api";
import { NextRequest, NextResponse } from "next/server";

export async function requestWebAuth(
  request: NextRequest,
  path: string,
): Promise<Response> {
  return fetch(`${API_CONFIG.baseURL}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
  });
}

export function copySetCookieHeaders(
  source: Response,
  target: NextResponse,
): number {
  const cookies = source.headers.getSetCookie();

  cookies.forEach((cookie) => {
    target.headers.append("set-cookie", cookie);
  });

  return cookies.length;
}
