export class ClientApiError extends Error {
  constructor(readonly status: number) {
    super(`API request failed with status ${status}`);
  }
}

let refreshPromise: Promise<boolean> | null = null;

export async function clientApi<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    cache: "no-store",
  });

  if (response.status === 401 && !(await refreshWebSession())) {
    if (typeof window !== "undefined") {
      window.location.assign("/");
    }
    throw new ClientApiError(401);
  }

  if (response.status === 401) {
    const retried = await fetch(input, {
      ...init,
      cache: "no-store",
    });
    if (!retried.ok) {
      throw new ClientApiError(retried.status);
    }
    return (await retried.json()) as T;
  }

  if (!response.ok) {
    throw new ClientApiError(response.status);
  }
  return (await response.json()) as T;
}

async function refreshWebSession() {
  refreshPromise ??= fetch("/auth/refresh", {
    method: "POST",
    cache: "no-store",
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}
