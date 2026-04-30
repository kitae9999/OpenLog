"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type {
  DeleteDiscussionResult,
  DiscussionMutationResult,
} from "@/entities/post/api/getPostSuggestionDetail";
import { API_CONFIG } from "@/shared/api";

export async function submitSuggestionDiscussion(
  postId: number,
  suggestionId: number,
  content: string,
): Promise<DiscussionMutationResult> {
  return sendDiscussionMutation(
    `${API_CONFIG.baseURL}/posts/${postId}/suggestions/${suggestionId}/discussions`,
    "POST",
    content,
    "댓글 내용을 입력해주세요.",
    "댓글을 작성하는 중 문제가 발생했습니다.",
  );
}

export async function updateSuggestionDiscussion(
  postId: number,
  suggestionId: number,
  discussionId: number,
  content: string,
): Promise<DiscussionMutationResult> {
  return sendDiscussionMutation(
    `${API_CONFIG.baseURL}/posts/${postId}/suggestions/${suggestionId}/discussions/${discussionId}`,
    "PATCH",
    content,
    "수정할 내용을 입력해주세요.",
    "댓글을 수정하는 중 문제가 발생했습니다.",
  );
}

export async function deleteSuggestionDiscussion(
  postId: number,
  suggestionId: number,
  discussionId: number,
): Promise<DeleteDiscussionResult> {
  const headerStore = await headers();
  const response = await fetch(
    `${API_CONFIG.baseURL}/posts/${postId}/suggestions/${suggestionId}/discussions/${discussionId}`,
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

async function sendDiscussionMutation(
  url: string,
  method: "POST" | "PATCH",
  content: string,
  emptyMessage: string,
  fallbackMessage: string,
): Promise<DiscussionMutationResult> {
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
    return {
      ok: true,
      discussion: await response.json(),
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
