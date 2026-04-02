import { ApiError } from "@/shared/model/ApiError";

type ApiClientOptions = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

export async function apiClient<T>(
  url: string,
  options?: ApiClientOptions,
): Promise<T> {
  const res = await fetch(url, options);

  if (!res.ok) {
    throw new ApiError(res.status);
  }

  return (await res.json()) as T;
}
