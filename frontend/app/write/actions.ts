"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { API_CONFIG } from "@/shared/api";
import { buildPublicPostPath } from "@/shared/lib/publicRoutes";
import type { WriteActionState } from "./action-state";

type PostWriteResponse = {
  authorUsername: string;
  slug: string;
};

export async function submitPost(
  _prevState: WriteActionState,
  formData: FormData,
): Promise<WriteActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const topics = formData
    .getAll("topics")
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);

  const errors: WriteActionState["errors"] = {};

  if (!title) {
    errors.title = "제목은 필수입니다.";
  }

  if (!description) {
    errors.description = "설명은 필수입니다.";
  }

  if (!content) {
    errors.content = "본문은 필수입니다.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const headerStore = await headers();
  const response = await fetch(`${API_CONFIG.baseURL}/posts`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      cookie: headerStore.get("cookie") ?? "",
    },
    body: JSON.stringify({
      title,
      description,
      content,
      topics,
    }),
  });

  if (response.ok) {
    const payload = (await response.json()) as PostWriteResponse;
    redirect(buildPublicPostPath(payload.authorUsername, payload.slug));
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
    errors: {
      form: errorBody?.message ?? "글을 발행하는 중 문제가 발생했습니다.",
    },
  };
}
