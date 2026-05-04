import { headers } from "next/headers";
import { API_CONFIG } from "@/shared/api";
import { apiClient } from "@/shared/api/apiClient";
import type { RecentPostCursorPage } from "./getRecentPosts";

export async function getLikedPosts(cursor?: string | null, size = 10) {
  const headerStore = await headers();
  const params = new URLSearchParams({
    size: String(size),
  });
  if (cursor) {
    params.set("cursor", cursor);
  }

  return apiClient<RecentPostCursorPage>(
    `${API_CONFIG.baseURL}/users/me/liked-posts?${params}`,
    {
      cache: "no-store",
      headers: {
        cookie: headerStore.get("cookie") ?? "",
      },
    },
  );
}
