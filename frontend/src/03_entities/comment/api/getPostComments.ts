import { API_CONFIG } from "@/shared/api";
import { apiClient } from "@/shared/api/apiClient";

export type Comment = {
  id: number;
  authorName: string;
  authorProfileImageUrl: string | null;
  content: string;
  createdAt: string;
};

export async function getPostComments(postId: number) {
  return apiClient<Comment[]>(
    `${API_CONFIG.baseURL}/posts/${postId}/comments`,
    {
      cache: "no-store",
    },
  );
}
