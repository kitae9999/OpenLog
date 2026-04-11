import { API_CONFIG } from "@/shared/api";
import { apiClient } from "@/shared/api/apiClient";

export type Comment = {
  id: number;
  authorName: string;
  authorProfileImageUrl: string | null;
  content: string;
  createdAt: string;
};

export type SubmitCommentResult =
  | {
      ok: true;
      comment: Comment;
    }
  | {
      ok: false;
      message: string;
    };

export type SubmitCommentAction = (
  content: string,
) => Promise<SubmitCommentResult>;

export async function getPostComments(postId: number) {
  return apiClient<Comment[]>(
    `${API_CONFIG.baseURL}/posts/${postId}/comments`,
    {
      cache: "no-store",
    },
  );
}
