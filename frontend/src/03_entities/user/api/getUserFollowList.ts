import { API_CONFIG } from "@/shared/api";
import { apiClient } from "@/shared/api/apiClient";

export type FollowListType = "followers" | "following";

export type FollowUser = {
  username: string;
  nickname: string | null;
  profileImageUrl: string | null;
  isOpenLogOfficial: boolean;
};

export async function getUserFollowList(
  username: string,
  type: FollowListType,
) {
  return apiClient<FollowUser[]>(
    `${API_CONFIG.baseURL}/users/${encodeURIComponent(username)}/${type}`,
    {
      cache: "no-store",
    },
  );
}
