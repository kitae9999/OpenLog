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
  thumbnailSrc: string | null;
  likes: number;
  comments: number;
};

export type RecentPostCursorPage = {
  posts: RecentPostSummary[];
  size: number;
  nextCursor: string | null;
  hasNext: boolean;
};

type GetRecentPostsOptions = {
  cache?: RequestCache;
  next?: { revalidate?: number };
};

export function getRecentPosts(
  cursor?: string | null,
  size = 10,
  options?: GetRecentPostsOptions,
) {
  const params = new URLSearchParams({
    size: String(size),
  });
  if (cursor) {
    params.set("cursor", cursor);
  }

  return apiClient<RecentPostCursorPage>(
    `${API_CONFIG.baseURL}/posts?${params}`,
    {
      cache: options?.cache ?? "no-store",
      next: options?.next,
    },
  );
}
