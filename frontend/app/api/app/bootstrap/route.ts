import type { NextRequest } from "next/server";
import { proxyBackendGet } from "../../_lib/backendProxy";

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  const params = new URLSearchParams();
  if (workspaceId && /^\d+$/.test(workspaceId)) {
    params.set("workspaceId", workspaceId);
  }
  const query = params.size > 0 ? `?${params}` : "";
  return proxyBackendGet(`/app/bootstrap${query}`);
}
