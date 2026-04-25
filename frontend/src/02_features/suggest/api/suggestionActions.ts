"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { API_CONFIG } from "@/shared/api";

type SuggestionFieldName = "title" | "description" | "content";
export type ManageSuggestionAction = "MERGE" | "REJECT" | "CLOSE";

export type SuggestionActionState = {
  errors: Partial<Record<SuggestionFieldName | "form", string>>;
  redirectTo?: string;
};

export async function createPostSuggestionAction(
  postId: number,
  redirectTo: string,
  _prevState: SuggestionActionState,
  formData: FormData,
): Promise<SuggestionActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const errors: SuggestionActionState["errors"] = {};

  if (!title) {
    errors.title = "제안 제목은 필수입니다.";
  }

  if (!description) {
    errors.description = "제안 설명은 필수입니다.";
  }

  if (!content) {
    errors.content = "제안 본문은 필수입니다.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const headerStore = await headers();
  const response = await fetch(
    `${API_CONFIG.baseURL}/posts/${postId}/suggestions`,
    {
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
      }),
    },
  );

  if (response.ok) {
    return {
      errors: {},
      redirectTo,
    };
  }

  if (response.status === 401) {
    redirect("/");
  }

  return {
    errors: {
      form: await getErrorMessage(
        response,
        "제안을 제출하는 중 문제가 발생했습니다.",
      ),
    },
  };
}

export async function updatePostSuggestionAction(
  postId: number,
  suggestionId: number,
  redirectTo: string,
  _prevState: SuggestionActionState,
  formData: FormData,
): Promise<SuggestionActionState> {
  const { title, description, content, errors } =
    parseSuggestionWriteForm(formData);

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const headerStore = await headers();
  const response = await fetch(
    `${API_CONFIG.baseURL}/posts/${postId}/suggestions/${suggestionId}`,
    {
      method: "PATCH",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        cookie: headerStore.get("cookie") ?? "",
      },
      body: JSON.stringify({
        title,
        description,
        content,
      }),
    },
  );

  if (response.ok) {
    return {
      errors: {},
      redirectTo,
    };
  }

  if (response.status === 401) {
    redirect("/");
  }

  return {
    errors: {
      form: await getErrorMessage(
        response,
        "제안을 저장하는 중 문제가 발생했습니다.",
      ),
    },
  };
}

export async function manageSuggestionAction(
  postId: number,
  suggestionId: number,
  action: ManageSuggestionAction,
  redirectTo: string,
) {
  const headerStore = await headers();
  const response = await fetch(
    `${API_CONFIG.baseURL}/posts/${postId}/suggestions/${suggestionId}/resolutions`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        cookie: headerStore.get("cookie") ?? "",
      },
      body: JSON.stringify({
        action,
      }),
    },
  );

  if (response.ok) {
    redirect(redirectTo);
  }

  if (response.status === 401) {
    redirect("/");
  }

  throw new Error(
    await getErrorMessage(response, "제안 상태를 변경하는 중 문제가 발생했습니다."),
  );
}

function parseSuggestionWriteForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const errors: SuggestionActionState["errors"] = {};

  if (!title) {
    errors.title = "제안 제목은 필수입니다.";
  }

  if (!description) {
    errors.description = "제안 설명은 필수입니다.";
  }

  if (!content) {
    errors.content = "제안 본문은 필수입니다.";
  }

  return {
    title,
    description,
    content,
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
