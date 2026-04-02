import { API_CONFIG } from "@/shared/api";
import { User } from "@/entities/user/model/User";

export const getUser = async (): Promise<User | null> => {
  try {
    const res = await fetch(`${API_CONFIG.baseURL}/auth/me`, {
      cache: "no-store",
    });

    if (res.status === 401) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return (await res.json()) as User;
  } catch (error) {
    throw error;
  }
};
