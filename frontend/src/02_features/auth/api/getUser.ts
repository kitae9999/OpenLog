import axios from "axios";
import { API_CONFIG } from "@/shared/lib/api";
import { User } from "@/entities/user/model/User";

export const getUser = async (): Promise<User | null> => {
  try {
    const response = await axios.get<User>(`${API_CONFIG.baseURL}/auth/me`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    throw error;
  }
};
