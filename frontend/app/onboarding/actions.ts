"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { API_CONFIG } from "@/shared/api";

const USERNAME_PATTERN = /^[a-z0-9]+$/;

export type OnboardingFormValues = {
  nickname: string;
  username: string;
  bio: string;
};

export type OnboardingActionState = {
  values: OnboardingFormValues;
  errors: Partial<Record<"nickname" | "username" | "bio" | "form", string>>;
};

export async function submitOnboarding(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const values = {
    nickname: String(formData.get("nickname") ?? "").trim(),
    username: String(formData.get("username") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim(),
  };
  const errors: OnboardingActionState["errors"] = {};

  if (!values.nickname) {
    errors.nickname = "닉네임은 필수입니다.";
  } else if (values.nickname.length > 40) {
    errors.nickname = "닉네임은 40자 이하로 입력해주세요.";
  }

  if (!values.username) {
    errors.username = "username은 필수입니다.";
  } else if (values.username.length < 3 || values.username.length > 20) {
    errors.username = "username은 3자 이상 20자 이하로 입력해주세요.";
  } else if (!USERNAME_PATTERN.test(values.username)) {
    errors.username = "username은 영어 소문자와 숫자만 사용할 수 있습니다.";
  }

  if (values.bio.length > 160) {
    errors.bio = "bio는 160자 이하로 입력해주세요.";
  }

  if (Object.keys(errors).length > 0) {
    return { values, errors };
  }

  const headerStore = await headers();
  const response = await fetch(`${API_CONFIG.baseURL}/auth/onboarding`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      cookie: headerStore.get("cookie") ?? "",
    },
    body: JSON.stringify({
      nickname: values.nickname,
      username: values.username,
      bio: values.bio || null,
    }),
  });

  if (response.ok) {
    redirect("/");
  }

  let errorBody: { code?: string; message?: string } | null = null;

  try {
    errorBody = (await response.json()) as { code?: string; message?: string };
  } catch {
    errorBody = null;
  }

  if (response.status === 401) {
    redirect("/");
  }

  if (response.status === 409 && errorBody?.code === "USERNAME_TAKEN") {
    return {
      values,
      errors: {
        username: errorBody.message ?? "이미 사용 중인 username입니다.",
      },
    };
  }

  return {
    values,
    errors: {
      form: errorBody?.message ?? "온보딩 저장 중 문제가 발생했습니다.",
    },
  };
}
