import { headers } from "next/headers";
import { API_CONFIG } from "@/shared/api";
import { apiClient } from "@/shared/api/apiClient";
import type { RecentPostCursorPage } from "./getRecentPosts";

export async function getAuthoredPosts(
  cursor?: string | null,
  size = 10,
  statuses: Array<"DRAFT" | "PUBLISHED" | "UNPUBLISHED"> = ["PUBLISHED"],
) {
  const headerStore = await headers();
  const params = new URLSearchParams({
    size: String(size),
  });
  if (cursor) {
    params.set("cursor", cursor);
  }
  statuses.forEach((status) => params.append("status", status));

  return apiClient<RecentPostCursorPage>(
    `${API_CONFIG.baseURL}/users/me/posts?${params}`,
    {
      cache: "no-store",
      headers: {
        cookie: headerStore.get("cookie") ?? "",
      },
    },
  );
}
