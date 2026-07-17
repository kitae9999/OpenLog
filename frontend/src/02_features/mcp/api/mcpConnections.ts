import { headers } from "next/headers";
import { API_CONFIG } from "@/shared/api";
import { apiClient } from "@/shared/api/apiClient";
import { ApiError } from "@/shared/model/ApiError";

export type McpConnection = {
  id: string;
  clientId: string;
  clientName: string;
  callbackOrigin: string;
  permissionProfile: "read-only" | "safe-write" | "full";
  createdAt: string;
  updatedAt: string;
};

export async function listMcpConnections(): Promise<McpConnection[]> {
  const headerStore = await headers();
  try {
    return await apiClient<McpConnection[]>(
      `${API_CONFIG.baseURL}/auth/mcp/connections`,
      {
        cache: "no-store",
        headers: { cookie: headerStore.get("cookie") ?? "" },
      },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return [];
    throw error;
  }
}
