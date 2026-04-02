type ApiClientOptions = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

export const apiClient = async <T>(
  url: string,
  options?: ApiClientOptions,
): Promise<T> => {
  const res = await fetch(url, options);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return (await res.json()) as T;
};
