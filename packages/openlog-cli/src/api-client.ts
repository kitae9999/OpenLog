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
  refreshToken?: string;
  apiBaseUrl?: string;
  onTokenRefresh?: (tokens: RefreshedTokens) => Promise<void> | void;
};

export type RefreshedTokens = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
};

export class OpenLogApiClient {
  private readonly apiBaseUrl: string;
  private accessToken?: string;
  private refreshToken?: string;
  private readonly onTokenRefresh?: OpenLogApiClientOptions["onTokenRefresh"];
  private refreshPromise?: Promise<void>;

  constructor(options: OpenLogApiClientOptions = {}) {
    this.apiBaseUrl = (options.apiBaseUrl ?? getApiBaseUrl()).replace(/\/$/, "");
    this.accessToken = options.accessToken;
    this.refreshToken = options.refreshToken;
    this.onTokenRefresh = options.onTokenRefresh;
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

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
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

  async patchNoContent(path: string, body?: unknown): Promise<void> {
    await this.request<void>(path, {
      method: "PATCH",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    allowRefresh = true,
  ): Promise<T> {
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

    if (response.status === 401 && allowRefresh && this.refreshToken) {
      await this.refreshAccessToken();
      return this.request<T>(path, init, false);
    }

    if (!response.ok) {
      throw new ApiError(response.status, url, await readErrorMessage(response));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performTokenRefresh().finally(() => {
        this.refreshPromise = undefined;
      });
    }

    await this.refreshPromise;
  }

  private async performTokenRefresh(): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/auth/device/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    if (!response.ok) {
      throw new ApiError(
        response.status,
        `${this.apiBaseUrl}/auth/device/refresh`,
        await readErrorMessage(response),
      );
    }

    const tokens = (await response.json()) as RefreshedTokens;
    if (!isRefreshedTokens(tokens)) {
      throw new Error("OpenLog refresh response is incomplete.");
    }

    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    await this.onTokenRefresh?.(tokens);
  }
}

function isRefreshedTokens(value: RefreshedTokens): boolean {
  return Boolean(
    value.accessToken &&
      value.refreshToken &&
      Number.isFinite(value.expiresIn) &&
      Number.isFinite(value.refreshExpiresIn),
  );
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? `OpenLog API request failed with ${response.status}`;
  } catch {
    return `OpenLog API request failed with ${response.status}`;
  }
}
