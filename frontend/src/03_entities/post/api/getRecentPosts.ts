import { API_CONFIG } from "@/shared/api";
import { apiClient } from "@/shared/api/apiClient";

export type RecentPostSummary = {
  id: number;
  slug: string;
  title: string;
  description: string;
  publishedAtLabel: string;
  authorUsername: string;
  authorName: string;
  authorAvatarSrc: string | null;
  likes: number;
  comments: number;
};

export type RecentPostCursorPage = {
  posts: RecentPostSummary[];
  size: number;
  nextCursor: string | null;
  hasNext: boolean;
};

export function getRecentPosts(cursor?: string | null, size = 10) {
  const params = new URLSearchParams({
    size: String(size),
  });
  if (cursor) {
    params.set("cursor", cursor);
  }

  return apiClient<RecentPostCursorPage>(
    `${API_CONFIG.baseURL}/posts?${params}`,
    {
      cache: "no-store",
    },
  );
}
