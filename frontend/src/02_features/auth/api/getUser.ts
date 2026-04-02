import { API_CONFIG } from "@/shared/api";
import { User } from "@/entities/user/model/User";
import { apiClient } from "@/shared/api/apiClient";
import { ApiError } from "@/shared/model/ApiError";
import { headers } from "next/headers";
import { cache } from "react";

/**
 * 현재 로그인한 유저 정보 반환, 로그인안되어있으면 null 반환
 */
export const getUser = cache(async (): Promise<User | null> => {
  const headerStore = await headers();

  try {
    return await apiClient<User>(`${API_CONFIG.baseURL}/auth/me`, {
      cache: "no-store",
      headers: {
        cookie: headerStore.get("cookie") ?? "",
      },
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return null;
    }
    throw e;
  }
});
