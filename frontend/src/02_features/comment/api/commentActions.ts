"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  type Comment,
  type CommentMutationResult,
  type DeleteCommentResult,
} from "@/entities/comment/api/getPostComments";
import { API_CONFIG } from "@/shared/api";

export async function submitPostComment(
  postId: number,
  content: string,
): Promise<CommentMutationResult> {
  return sendCommentMutation(
    `${API_CONFIG.baseURL}/posts/${postId}/comments`,
    "POST",
    content,
    "댓글 내용을 입력해주세요.",
    "댓글을 작성하는 중 문제가 발생했습니다.",
  );
}

export async function updatePostComment(
  postId: number,
  commentId: number,
  content: string,
): Promise<CommentMutationResult> {
  return sendCommentMutation(
    `${API_CONFIG.baseURL}/posts/${postId}/comments/${commentId}`,
    "PATCH",
    content,
    "수정할 내용을 입력해주세요.",
    "댓글을 수정하는 중 문제가 발생했습니다.",
  );
}

export async function deletePostComment(
  postId: number,
  commentId: number,
): Promise<DeleteCommentResult> {
  const headerStore = await headers();
  const response = await fetch(
    `${API_CONFIG.baseURL}/posts/${postId}/comments/${commentId}`,
    {
      method: "DELETE",
      cache: "no-store",
      headers: {
        cookie: headerStore.get("cookie") ?? "",
      },
    },
  );

  if (response.ok) {
    return { ok: true };
  }

  if (response.status === 401) {
    redirect("/");
  }

  return {
    ok: false,
    message: await getErrorMessage(
      response,
      "댓글을 삭제하는 중 문제가 발생했습니다.",
    ),
  };
}

async function sendCommentMutation(
  url: string,
  method: "POST" | "PATCH",
  content: string,
  emptyMessage: string,
  fallbackMessage: string,
): Promise<CommentMutationResult> {
  const nextContent = content.trim();
  if (!nextContent) {
    return {
      ok: false,
      message: emptyMessage,
    };
  }

  const headerStore = await headers();
  const response = await fetch(url, {
    method,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      cookie: headerStore.get("cookie") ?? "",
    },
    body: JSON.stringify({
      content: nextContent,
    }),
  });

  if (response.ok) {
    const comment = (await response.json()) as Comment;
    return {
      ok: true,
      comment,
    };
  }

  if (response.status === 401) {
    redirect("/");
  }

  return {
    ok: false,
    message: await getErrorMessage(response, fallbackMessage),
  };
}

async function getErrorMessage(response: Response, fallbackMessage: string) {
  let errorBody: { message?: string } | null = null;

  try {
    errorBody = (await response.json()) as { message?: string };
  } catch {
    errorBody = null;
  }

  return errorBody?.message ?? fallbackMessage;
}
