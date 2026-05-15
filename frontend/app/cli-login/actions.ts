"use server";

import { headers } from "next/headers";
import { API_CONFIG } from "@/shared/api";

export type CliLoginApprovalState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export async function approveCliLogin(
  _prevState: CliLoginApprovalState,
  formData: FormData,
): Promise<CliLoginApprovalState> {
  const userCode = String(formData.get("userCode") ?? "").trim();

  if (!userCode) {
    return {
      status: "error",
      message: "승인 코드가 없습니다.",
    };
  }

  const headerStore = await headers();
  const response = await fetch(`${API_CONFIG.baseURL}/auth/device/approve`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      cookie: headerStore.get("cookie") ?? "",
    },
    body: JSON.stringify({ userCode }),
  }).catch(() => null);

  if (!response) {
    return {
      status: "error",
      message: "OpenLog 서버에 연결할 수 없습니다.",
    };
  }

  if (response.status === 204) {
    return {
      status: "success",
      message: "CLI 로그인이 승인되었습니다. 터미널로 돌아가세요.",
    };
  }

  let errorBody: { message?: string } | null = null;
  try {
    errorBody = (await response.json()) as { message?: string };
  } catch {
    errorBody = null;
  }

  return {
    status: "error",
    message: errorBody?.message ?? "CLI 로그인 승인에 실패했습니다.",
  };
}

