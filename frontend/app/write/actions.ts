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

type PostWriteLink = {
  label: string;
  targetSlug: string;
};

const DESCRIPTION_MAX_LENGTH = 50;

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
  const links = parsePostWriteLinks(formData);

  const errors: WriteActionState["errors"] = {};

  if (!title) {
    errors.title = "제목은 필수입니다.";
  }

  if (!description) {
    errors.description = "설명은 필수입니다.";
  } else if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `설명은 ${DESCRIPTION_MAX_LENGTH}자 이하여야 합니다.`;
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
      links,
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

function parsePostWriteLinks(formData: FormData): PostWriteLink[] {
  const rawLinks = String(formData.get("links") ?? "");
  if (!rawLinks) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawLinks) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const links: PostWriteLink[] = [];
    const seen = new Set<string>();

    for (const item of parsed) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const { label, targetSlug } = item as Partial<PostWriteLink>;
      const normalizedLabel = typeof label === "string" ? label.trim() : "";
      const normalizedTargetSlug =
        typeof targetSlug === "string" ? targetSlug.trim() : "";

      if (!normalizedLabel || !normalizedTargetSlug) {
        continue;
      }

      const key = `${normalizedLabel}\u0000${normalizedTargetSlug}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      links.push({
        label: normalizedLabel,
        targetSlug: normalizedTargetSlug,
      });
    }

    return links;
  } catch {
    return [];
  }
}
