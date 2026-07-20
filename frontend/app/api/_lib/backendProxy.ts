import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { API_CONFIG } from "@/shared/api";

export async function proxyBackendGet(path: string) {
  const headerStore = await headers();
  const response = await fetch(`${API_CONFIG.baseURL}${path}`, {
    cache: "no-store",
    headers: {
      cookie: headerStore.get("cookie") ?? "",
    },
  }).catch(() => null);

  if (!response) {
    return NextResponse.json(
      { message: "Backend API is unavailable." },
      { status: 502 },
    );
  }

  const body = await response.arrayBuffer();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type":
        response.headers.get("content-type") ?? "application/json",
    },
  });
}
