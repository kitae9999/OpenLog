import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/shared/api";

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get("cursor");
  const size = request.nextUrl.searchParams.get("size") ?? "10";
  const params = new URLSearchParams({ size });
  if (cursor) {
    params.set("cursor", cursor);
  }

  const response = await fetch(`${API_CONFIG.baseURL}/posts?${params}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { message: "Failed to load recent posts." },
      { status: response.status },
    );
  }

  return NextResponse.json(await response.json());
}
