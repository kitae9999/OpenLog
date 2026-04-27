import { headers } from "next/headers";
import { API_CONFIG } from "@/shared/api";
import { apiClient } from "@/shared/api/apiClient";
import { ApiError } from "@/shared/model/ApiError";
import type { ApiSuggestionStatus } from "./getPostSuggestions";

export type ApiSuggestionDetail = {
  id: number;
  title: string;
  content: string;
  baseContent: string;
  description: string;
  status: ApiSuggestionStatus;
  authorId: number;
  authorName: string;
  authorProfileImageUrl: string | null;
  createdAt: string;
  postBaseVersion: number;
  discussions: ApiDiscussion[];
};

export type ApiDiscussion = {
  id: number;
  authorName: string;
  authorProfileImageUrl: string | null;
  content: string;
  createdAt: string;
  canManage: boolean;
};

export async function getPostSuggestionDetail(
  postId: number,
  suggestionId: number,
) {
  const headerStore = await headers();

  try {
    return await apiClient<ApiSuggestionDetail>(
      `${API_CONFIG.baseURL}/posts/${postId}/suggestions/${suggestionId}`,
      {
        cache: "no-store",
        headers: {
          cookie: headerStore.get("cookie") ?? "",
        },
      },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
