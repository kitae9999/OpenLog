import { API_CONFIG } from "@/shared/api";

export type ApiPostDetail = {
  id: number;
  title: string;
  description: string;
  content: string;
  authorName: string;
  authorAvatarSrc: string | null;
  publishedAtLabel: string;
  readTimeLabel: string;
  topics: string[];
  likes: number;
  comments: number;
};

export async function getPostDetail(id: number, cookie: string) {
  const response = await fetch(`${API_CONFIG.baseURL}/posts/${id}`, {
    cache: "no-store",
    headers: {
      cookie,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load post detail.");
  }

  return (await response.json()) as ApiPostDetail;
}
