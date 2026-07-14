import { NextRequest } from "next/server";
import { API_CONFIG } from "@/shared/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { workspaceId } = await context.params;
  if (!/^\d+$/.test(workspaceId)) {
    return new Response("Invalid workspace id", { status: 400 });
  }

  const upstream = await fetch(
    `${API_CONFIG.baseURL}/workspaces/${workspaceId}/events`,
    {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    },
  ).catch(() => null);

  if (!upstream) {
    return new Response("Upstream unavailable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(upstream.statusText || "SSE proxy failed", {
      status: upstream.status || 502,
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
