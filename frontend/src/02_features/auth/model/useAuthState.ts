import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/features/auth/api/getUser";

export const useAuthState = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["authState"],
    queryFn: getUser,
    staleTime: 1000 * 5 * 60,
    gcTime: 1000 * 30 * 60,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
