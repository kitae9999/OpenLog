import "server-only";

import { headers } from "next/headers";
import { API_CONFIG } from "@/shared/api";
import {
  mapAppBootstrap,
  type AppBootstrap,
  type AppBootstrapResponse,
} from "@/features/app-session/model/appBootstrap";

const ACTIVE_WORKSPACE_COOKIE = "openlog-active-workspace";

export async function getAppBootstrap(): Promise<AppBootstrap | null> {
  const headerStore = await headers();
  const cookie = headerStore.get("cookie") ?? "";
  const workspaceId = readCookie(cookie, ACTIVE_WORKSPACE_COOKIE);
  const params = new URLSearchParams();
  if (workspaceId && /^\d+$/.test(workspaceId)) {
    params.set("workspaceId", workspaceId);
  }
  const query = params.size > 0 ? `?${params}` : "";
  const response = await fetch(`${API_CONFIG.baseURL}/app/bootstrap${query}`, {
    cache: "no-store",
    headers: { cookie },
  });
  if (!response.ok) {
    return null;
  }
  return mapAppBootstrap((await response.json()) as AppBootstrapResponse);
}

function readCookie(cookie: string, name: string) {
  const prefix = `${name}=`;
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}
