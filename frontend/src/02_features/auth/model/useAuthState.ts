import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/features/auth/api/getUser";

export const useAuthState = () => {
  const { data } = useQuery({
    queryKey: ["authState"],
    queryFn: getUser,
  });

  return data;
};
