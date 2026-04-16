"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { WriteActionState } from "@/app/write/action-state";
import { API_CONFIG } from "@/shared/api";
import { buildPublicPostPath } from "@/shared/lib/publicRoutes";

type PostWriteResponse = {
  authorUsername: string;
  slug: string;
};

export type DeletePostResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export async function updatePostAction(
  postId: number,
  _prevState: WriteActionState,
  formData: FormData,
): Promise<WriteActionState> {
  const { title, description, content, topics, errors } =
    parsePostWriteForm(formData);

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const headerStore = await headers();
  const response = await fetch(`${API_CONFIG.baseURL}/posts/${postId}`, {
    method: "PUT",
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
    return {
      errors: {},
      redirectTo: buildPublicPostPath(payload.authorUsername, payload.slug),
    };
  }

  if (response.status === 401) {
    redirect("/");
  }

  return {
    errors: {
      form: await getErrorMessage(
        response,
        "글을 저장하는 중 문제가 발생했습니다.",
      ),
    },
  };
}

export async function deletePostAction(
  postId: number,
): Promise<DeletePostResult> {
  const headerStore = await headers();
  const response = await fetch(`${API_CONFIG.baseURL}/posts/${postId}`, {
    method: "DELETE",
    cache: "no-store",
    headers: {
      cookie: headerStore.get("cookie") ?? "",
    },
  });

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
      "글을 삭제하는 중 문제가 발생했습니다.",
    ),
  };
}

function parsePostWriteForm(formData: FormData) {
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

  return {
    title,
    description,
    content,
    topics,
    errors,
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
