"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { DiscussionMutationResult } from "@/entities/post/api/getPostSuggestionDetail";
import { API_CONFIG } from "@/shared/api";

export async function submitSuggestionDiscussion(
  postId: number,
  suggestionId: number,
  content: string,
): Promise<DiscussionMutationResult> {
  const nextContent = content.trim();
  if (!nextContent) {
    return {
      ok: false,
      message: "댓글 내용을 입력해주세요.",
    };
  }

  const headerStore = await headers();
  const response = await fetch(
    `${API_CONFIG.baseURL}/posts/${postId}/suggestions/${suggestionId}/discussions`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        cookie: headerStore.get("cookie") ?? "",
      },
      body: JSON.stringify({
        content: nextContent,
      }),
    },
  );

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
    message: await getErrorMessage(
      response,
      "댓글을 작성하는 중 문제가 발생했습니다.",
    ),
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
