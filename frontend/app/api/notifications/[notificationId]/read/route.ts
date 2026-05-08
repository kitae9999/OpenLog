import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { API_CONFIG } from "@/shared/api";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  const headerStore = await headers();
  const { notificationId } = await params;
  const response = await fetch(
    `${API_CONFIG.baseURL}/notifications/${encodeURIComponent(notificationId)}/read`,
    {
      method: "PATCH",
      cache: "no-store",
      headers: {
        cookie: headerStore.get("cookie") ?? "",
      },
    },
  ).catch(() => null);

  if (!response) {
    return NextResponse.json(
      { message: "Failed to mark notification as read." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { message: "Failed to mark notification as read." },
      { status: response.status },
    );
  }

  return NextResponse.json(await response.json());
}
