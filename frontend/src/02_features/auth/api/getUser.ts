import axios from "axios";
import { API_CONFIG } from "@/shared/lib/api";
import { User } from "@/entities/user/model/User";

export const getUser = async (): Promise<User> => {
  const response = await axios.get<User>(`${API_CONFIG.baseURL}/auth/me`);
  return response.data;
};
