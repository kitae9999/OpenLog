import { API_CONFIG } from "@/shared/api";
import { apiClient } from "@/shared/api/apiClient";
import { ApiError } from "@/shared/model/ApiError";
import { headers } from "next/headers";

export type PublicUserProfile = {
  username: string;
  nickname: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  location: string | null;
  websiteUrl: string | null;
  joinedAt: string;
  following: boolean;
};

export async function getPublicUserProfile(username: string) {
  const headerStore = await headers();

  try {
    return await apiClient<PublicUserProfile>(
      `${API_CONFIG.baseURL}/users/${encodeURIComponent(username)}`,
      {
        cache: "no-store",
        headers: {
          cookie: headerStore.get("cookie") ?? "",
        },
      },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
