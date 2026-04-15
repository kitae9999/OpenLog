"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { API_CONFIG } from "@/shared/api";

export type TogglePostLikeResult =
  | {
      ok: true;
      liked: boolean;
    }
  | {
      ok: false;
      message: string;
    };

export async function togglePostLike(
  postId: number,
): Promise<TogglePostLikeResult> {
  const headerStore = await headers();
  const response = await fetch(`${API_CONFIG.baseURL}/posts/${postId}/like`, {
    method: "POST",
    cache: "no-store",
    headers: {
      cookie: headerStore.get("cookie") ?? "",
    },
  });

  if (response.ok) {
    return {
      ok: true,
      liked: (await response.json()) as boolean,
    };
  }

  if (response.status === 401) {
    redirect("/");
  }

  return {
    ok: false,
    message: await getErrorMessage(
      response,
      "좋아요를 처리하는 중 문제가 발생했습니다.",
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
