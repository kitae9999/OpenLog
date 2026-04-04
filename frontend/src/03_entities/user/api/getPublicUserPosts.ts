import { API_CONFIG } from "@/shared/api";
import { apiClient } from "@/shared/api/apiClient";
import { ApiError } from "@/shared/model/ApiError";

export type PublicUserPostSummary = {
  slug: string;
  title: string;
  description: string;
  publishedAtLabel: string;
  readTimeLabel: string;
};

export async function getPublicUserPosts(username: string) {
  try {
    return await apiClient<PublicUserPostSummary[]>(
      `${API_CONFIG.baseURL}/users/${encodeURIComponent(username)}/posts`,
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
