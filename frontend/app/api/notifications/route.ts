import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { API_CONFIG } from "@/shared/api";

export async function GET(request: NextRequest) {
  const headerStore = await headers();
  const size = request.nextUrl.searchParams.get("size") ?? "1";
  const params = new URLSearchParams({ size });

  const response = await fetch(
    `${API_CONFIG.baseURL}/notifications?${params}`,
    {
      cache: "no-store",
      headers: {
        cookie: headerStore.get("cookie") ?? "",
      },
    },
  ).catch(() => null);

  if (!response) {
    return NextResponse.json(
      { message: "Failed to load notifications." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { message: "Failed to load notifications." },
      { status: response.status },
    );
  }

  return NextResponse.json(await response.json());
}
