import { mkdir, readFile, rm, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import { getApiBaseUrl, getAuthFilePath } from "./config.js";
import type { RefreshedTokens } from "./api-client.js";

export type AuthFile = {
  accessToken: string;
  refreshToken?: string;
  apiBaseUrl: string;
  createdAt: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
};

export type IssuedTokens = RefreshedTokens;

export async function readAuthFile(): Promise<AuthFile | null> {
  try {
    const content = await readFile(getAuthFilePath(), "utf8");
    const parsed = JSON.parse(content) as Partial<AuthFile>;

    if (!parsed.accessToken || !parsed.apiBaseUrl || !parsed.createdAt) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      apiBaseUrl: parsed.apiBaseUrl,
      createdAt: parsed.createdAt,
      accessTokenExpiresAt: parsed.accessTokenExpiresAt,
      refreshTokenExpiresAt: parsed.refreshTokenExpiresAt,
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }

    throw error;
  }
}

export async function writeAuthFile(tokens: IssuedTokens): Promise<AuthFile> {
  const authFile: AuthFile = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    apiBaseUrl: getApiBaseUrl(),
    createdAt: new Date().toISOString(),
    accessTokenExpiresAt: expiresAt(tokens.expiresIn),
    refreshTokenExpiresAt: expiresAt(tokens.refreshExpiresIn),
  };

  await persistAuthFile(authFile);
  return authFile;
}

export async function updateAuthFileTokens(
  authFile: AuthFile,
  tokens: RefreshedTokens,
): Promise<AuthFile> {
  const updatedAuthFile: AuthFile = {
    ...authFile,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt: expiresAt(tokens.expiresIn),
    refreshTokenExpiresAt: expiresAt(tokens.refreshExpiresIn),
  };

  await persistAuthFile(updatedAuthFile);
  return updatedAuthFile;
}

async function persistAuthFile(authFile: AuthFile): Promise<void> {
  const authFilePath = getAuthFilePath();

  await mkdir(path.dirname(authFilePath), { recursive: true, mode: 0o700 });
  await writeFile(authFilePath, `${JSON.stringify(authFile, null, 2)}\n`, {
    mode: 0o600,
  });
  await chmod(authFilePath, 0o600);
}

export async function deleteAuthFile(): Promise<void> {
  await rm(getAuthFilePath(), { force: true });
}

function expiresAt(expiresIn: number): string {
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}
