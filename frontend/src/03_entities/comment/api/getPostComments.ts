import { headers } from "next/headers";
import { API_CONFIG } from "@/shared/api";
import { apiClient } from "@/shared/api/apiClient";

export type Comment = {
  id: number;
  authorName: string;
  authorProfileImageUrl: string | null;
  content: string;
  createdAt: string;
  canManage: boolean;
};

export type CommentMutationResult =
  | {
      ok: true;
      comment: Comment;
    }
  | {
      ok: false;
      message: string;
    };

export type DeleteCommentResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export async function getPostComments(postId: number) {
  const headerStore = await headers();

  return apiClient<Comment[]>(
    `${API_CONFIG.baseURL}/posts/${postId}/comments`,
    {
      cache: "no-store",
      headers: {
        cookie: headerStore.get("cookie") ?? "",
      },
    },
  );
}
