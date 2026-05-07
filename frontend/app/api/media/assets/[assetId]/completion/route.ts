import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/shared/api";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const headerStore = await headers();
  const { assetId } = await params;
  const response = await fetch(
    `${API_CONFIG.baseURL}/media/assets/${encodeURIComponent(assetId)}/completion`,
    {
      method: "PATCH",
      cache: "no-store",
      headers: {
        cookie: headerStore.get("cookie") ?? "",
      },
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { message: "Failed to complete image upload." },
      { status: response.status },
    );
  }

  return new NextResponse(null, { status: 204 });
}
