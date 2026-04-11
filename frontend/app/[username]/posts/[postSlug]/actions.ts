"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  type Comment,
  type SubmitCommentResult,
} from "@/entities/comment/api/getPostComments";
import { API_CONFIG } from "@/shared/api";

export async function submitPostComment(
  postId: number,
  content: string,
): Promise<SubmitCommentResult> {
  const nextContent = content.trim();
  if (!nextContent) {
    return {
      ok: false,
      message: "댓글 내용을 입력해주세요.",
    };
  }

  const headerStore = await headers();
  const response = await fetch(`${API_CONFIG.baseURL}/posts/${postId}/comments`, {
    method: "POST",
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

  let errorBody: { message?: string } | null = null;

  try {
    errorBody = (await response.json()) as { message?: string };
  } catch {
    errorBody = null;
  }

  return {
    ok: false,
    message: errorBody?.message ?? "댓글을 작성하는 중 문제가 발생했습니다.",
  };
}
