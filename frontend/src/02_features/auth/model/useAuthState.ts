import { useQuery } from "@tanstack/react-query";
import type { User } from "@/entities/user/model/User";
import { clientApi } from "@/shared/api/clientApi";
import { appQueryKeys } from "@/shared/api/queryKeys";

export const useAuthState = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: appQueryKeys.session,
    queryFn: () => clientApi<User>("/api/auth/me"),
    staleTime: 1000 * 5 * 60,
    gcTime: 1000 * 30 * 60,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
