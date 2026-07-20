import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { proxyBackendGet } from "../../../_lib/backendProxy";

const COLLECTION_PATHS = new Set([
  "dashboard",
  "navigation-summary",
  "tasks",
  "logs",
  "todos",
  "outputs",
  "memories",
  "working-brief",
  "task-links",
  "log-links",
  "cross-links",
  "planner-view",
  "graph-view",
  "activity-view",
]);
const DETAIL_PATHS = new Set(["tasks", "logs", "outputs", "memories"]);

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ workspaceId: string; segments: string[] }>;
  },
) {
  const { workspaceId, segments } = await context.params;
  if (!/^\d+$/.test(workspaceId) || !isAllowedPath(segments)) {
    return NextResponse.json({ message: "Unsupported workspace query." }, { status: 404 });
  }

  const encodedPath = segments.map(encodeURIComponent).join("/");
  return proxyBackendGet(
    `/workspaces/${encodeURIComponent(workspaceId)}/${encodedPath}${request.nextUrl.search}`,
  );
}

function isAllowedPath(segments: string[]) {
  if (segments.length === 1) {
    return COLLECTION_PATHS.has(segments[0]);
  }
  return (
    segments.length === 2 &&
    DETAIL_PATHS.has(segments[0]) &&
    /^\d+$/.test(segments[1])
  );
}
