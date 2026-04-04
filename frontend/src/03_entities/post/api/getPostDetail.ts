import { API_CONFIG } from "@/shared/api";
import { ApiError } from "@/shared/model/ApiError";
import { apiClient } from "@/shared/api/apiClient";

export type ApiPostDetail = {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  authorUsername: string;
  authorName: string;
  authorAvatarSrc: string | null;
  publishedAtLabel: string;
  readTimeLabel: string;
  topics: string[];
  likes: number;
  comments: number;
};

export async function getPostDetail(username: string, slug: string) {
  try {
    return await apiClient<ApiPostDetail>(
      `${API_CONFIG.baseURL}/users/${encodeURIComponent(username)}/posts/${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
      },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
