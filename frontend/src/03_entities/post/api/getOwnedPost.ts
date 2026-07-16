import { headers } from "next/headers";
import { API_CONFIG } from "@/shared/api";
import { apiClient } from "@/shared/api/apiClient";
import { ApiError } from "@/shared/model/ApiError";

export type OwnedPostDetail = {
  id: number;
  status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
  slug: string;
  title: string;
  description: string;
  content: string;
  authorUsername: string;
  version: number;
  topics: string[];
  wikiLinks: Array<{
    label: string;
    targetSlug: string;
    targetTitle: string;
  }>;
  sourceOutput: { id: number; workspaceId: number } | null;
};

export async function getOwnedPost(postId: string) {
  const headerStore = await headers();

  try {
    return await apiClient<OwnedPostDetail>(
      `${API_CONFIG.baseURL}/posts/${encodeURIComponent(postId)}`,
      {
        cache: "no-store",
        headers: {
          cookie: headerStore.get("cookie") ?? "",
        },
      },
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 403 || error.status === 404)
    ) {
      return null;
    }
    throw error;
  }
}
