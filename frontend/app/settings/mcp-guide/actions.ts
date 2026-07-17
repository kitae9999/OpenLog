"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { API_CONFIG } from "@/shared/api";

const permissionProfiles = new Set(["read-only", "safe-write", "full"]);

export async function updateMcpConnection(formData: FormData) {
  const connectionId = String(formData.get("connectionId") ?? "");
  const permissionProfile = String(formData.get("permissionProfile") ?? "");
  if (!connectionId || !permissionProfiles.has(permissionProfile)) {
    throw new Error("MCP 연결 정보가 올바르지 않습니다.");
  }

  const headerStore = await headers();
  const response = await fetch(
    `${API_CONFIG.baseURL}/auth/mcp/connections/${encodeURIComponent(connectionId)}`,
    {
      method: "PATCH",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        cookie: headerStore.get("cookie") ?? "",
      },
      body: JSON.stringify({ permissionProfile }),
    },
  );
  if (!response.ok) {
    throw new Error("MCP 권한을 변경하지 못했습니다.");
  }
  revalidatePath("/settings/mcp-guide");
}

export async function revokeMcpConnection(formData: FormData) {
  const connectionId = String(formData.get("connectionId") ?? "");
  if (!connectionId) {
    throw new Error("MCP 연결 정보가 올바르지 않습니다.");
  }

  const headerStore = await headers();
  const response = await fetch(
    `${API_CONFIG.baseURL}/auth/mcp/connections/${encodeURIComponent(connectionId)}`,
    {
      method: "DELETE",
      cache: "no-store",
      headers: { cookie: headerStore.get("cookie") ?? "" },
    },
  );
  if (!response.ok) {
    throw new Error("MCP 연결을 해지하지 못했습니다.");
  }
  revalidatePath("/settings/mcp-guide");
}
