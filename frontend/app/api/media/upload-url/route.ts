import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/shared/api";

export async function POST(request: NextRequest) {
  const headerStore = await headers();
  const body = await request.text();

  const response = await fetch(`${API_CONFIG.baseURL}/media/upload-url`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      cookie: headerStore.get("cookie") ?? "",
    },
    body,
  });

  const responseBody = await response.text();
  const contentType = response.headers.get("content-type") ?? "application/json";

  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      "Content-Type": contentType,
    },
  });
}
