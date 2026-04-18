import { headers } from "next/headers";
import { API_CONFIG } from "@/shared/api";
import { apiClient } from "@/shared/api/apiClient";

export type ApiSuggestionStatus = "OPEN" | "CLOSED" | "MERGED" | "REJECTED";

export type ApiSuggestionSummary = {
  id: number;
  title: string;
  status: ApiSuggestionStatus;
  authorName: string;
  authorProfileImageUrl: string | null;
  createdAt: string;
  commentCount: number;
};

export async function getPostSuggestions(postId: number) {
  const headerStore = await headers();

  return apiClient<ApiSuggestionSummary[]>(
    `${API_CONFIG.baseURL}/posts/${postId}/suggestions`,
    {
      cache: "no-store",
      headers: {
        cookie: headerStore.get("cookie") ?? "",
      },
    },
  );
}
