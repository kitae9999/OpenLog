"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { PublicUserProfile } from "@/entities/user/api/getPublicUserProfile";
import { API_CONFIG } from "@/shared/api";
import { buildPublicProfilePath } from "@/shared/lib/publicRoutes";

export type UpdateProfileValues = {
  username: string;
  nickname: string;
  bio: string;
  location: string;
  websiteUrl: string;
};

export type UpdateProfileActionState = {
  values: UpdateProfileValues;
  errors: Partial<
    Record<"nickname" | "bio" | "location" | "websiteUrl" | "form", string>
  >;
  profile: PublicUserProfile | null;
};

export async function updateProfileAction(
  formData: FormData,
): Promise<UpdateProfileActionState> {
  const values: UpdateProfileValues = {
    username: String(formData.get("username") ?? "").trim(),
    nickname: String(formData.get("nickname") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim(),
    location: String(formData.get("location") ?? "").trim(),
    websiteUrl: String(formData.get("websiteUrl") ?? "").trim(),
  };
  const errors: UpdateProfileActionState["errors"] = {};

  if (!values.nickname) {
    errors.nickname = "닉네임은 필수입니다.";
  } else if (values.nickname.length > 40) {
    errors.nickname = "닉네임은 40자 이하로 입력해주세요.";
  }

  if (values.bio.length > 160) {
    errors.bio = "bio는 160자 이하로 입력해주세요.";
  }

  if (values.location.length > 100) {
    errors.location = "location은 100자 이하로 입력해주세요.";
  }

  if (values.websiteUrl.length > 2048) {
    errors.websiteUrl = "website URL은 2048자 이하로 입력해주세요.";
  }

  if (Object.keys(errors).length > 0) {
    return { values, errors, profile: null };
  }

  const headerStore = await headers();
  const response = await fetch(
    `${API_CONFIG.baseURL}/users/${encodeURIComponent(values.username)}`,
    {
      method: "PATCH",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        cookie: headerStore.get("cookie") ?? "",
      },
      body: JSON.stringify({
        nickname: values.nickname,
        bio: values.bio || null,
        location: values.location || null,
        websiteUrl: values.websiteUrl || null,
      }),
    },
  );

  if (response.ok) {
    const profile = (await response.json()) as PublicUserProfile;

    return {
      values: toUpdateProfileValues(profile),
      errors: {},
      profile,
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
    values,
    errors: {
      form: errorBody?.message ?? "프로필을 저장하는 중 문제가 발생했습니다.",
    },
    profile: null,
  };
}

export async function toggleFollowAction(
  username: string,
  following: boolean,
): Promise<void> {
  const headerStore = await headers();
  const response = await fetch(
    `${API_CONFIG.baseURL}/users/${encodeURIComponent(username)}/follow`,
    {
      method: following ? "DELETE" : "POST",
      cache: "no-store",
      headers: {
        cookie: headerStore.get("cookie") ?? "",
      },
    },
  );

  if (response.ok) {
    revalidatePath(buildPublicProfilePath(username));
    return;
  }

  if (response.status === 401) {
    redirect("/");
  }

  throw new Error("팔로우 상태를 변경하는 중 문제가 발생했습니다.");
}

function toUpdateProfileValues(profile: PublicUserProfile): UpdateProfileValues {
  return {
    username: profile.username,
    nickname: profile.nickname ?? "",
    bio: profile.bio ?? "",
    location: profile.location ?? "",
    websiteUrl: profile.websiteUrl ?? "",
  };
}
