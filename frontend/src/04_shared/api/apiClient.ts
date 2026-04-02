import { ApiError } from "@/shared/model/ApiError";

type ApiClientOptions = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

/**
 * 서버 컴포넌트용 JS fetch wrapper
 * @param url fetch 요청 주소
 * @param options cache 설정, 갱신 주기 설정
 */
export const apiClient = async <T>(
  url: string,
  options?: ApiClientOptions,
): Promise<T> => {
  const res = await fetch(url, options);

  if (!res.ok) {
    throw new ApiError(res.status);
  }

  return (await res.json()) as T;
};
