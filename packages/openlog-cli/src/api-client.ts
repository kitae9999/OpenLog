import { getApiBaseUrl } from "./config.js";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type OpenLogApiClientOptions = {
  accessToken?: string;
  apiBaseUrl?: string;
};

export class OpenLogApiClient {
  private readonly apiBaseUrl: string;
  private readonly accessToken?: string;

  constructor(options: OpenLogApiClientOptions = {}) {
    this.apiBaseUrl = (options.apiBaseUrl ?? getApiBaseUrl()).replace(/\/$/, "");
    this.accessToken = options.accessToken;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async postNoContent(path: string, body?: unknown): Promise<void> {
    await this.request<void>(path, {
      method: "POST",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const url = `${this.apiBaseUrl}${path}`;
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        ...(this.accessToken
          ? { cookie: `openlog_access_token=${this.accessToken}` }
          : {}),
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, url, await readErrorMessage(response));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? `OpenLog API request failed with ${response.status}`;
  } catch {
    return `OpenLog API request failed with ${response.status}`;
  }
}
