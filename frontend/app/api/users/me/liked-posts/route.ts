import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/shared/api";

export async function GET(request: NextRequest) {
  const headerStore = await headers();
  const cursor = request.nextUrl.searchParams.get("cursor");
  const size = request.nextUrl.searchParams.get("size") ?? "10";
  const params = new URLSearchParams({ size });
  if (cursor) {
    params.set("cursor", cursor);
  }

  const response = await fetch(
    `${API_CONFIG.baseURL}/users/me/liked-posts?${params}`,
    {
      cache: "no-store",
      headers: {
        cookie: headerStore.get("cookie") ?? "",
      },
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { message: "Failed to load liked posts." },
      { status: response.status },
    );
  }

  return NextResponse.json(await response.json());
}
