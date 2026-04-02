import { API_CONFIG } from "@/shared/api";
import { User } from "@/entities/user/model/User";
import { apiClient } from "@/shared/api/apiClient";
import { ApiError } from "@/shared/model/ApiError";

export const getUser = async (): Promise<User | null> => {
  try {
    return await apiClient<User>(`${API_CONFIG.baseURL}/auth/me`, {
      cache: "no-store",
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return null;
    }
    throw e;
  }
};
