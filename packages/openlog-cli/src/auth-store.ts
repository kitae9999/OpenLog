import { mkdir, readFile, rm, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import { getApiBaseUrl, getAuthFilePath } from "./config.js";

export type AuthFile = {
  accessToken: string;
  apiBaseUrl: string;
  createdAt: string;
};

export async function readAuthFile(): Promise<AuthFile | null> {
  try {
    const content = await readFile(getAuthFilePath(), "utf8");
    const parsed = JSON.parse(content) as Partial<AuthFile>;

    if (!parsed.accessToken || !parsed.apiBaseUrl || !parsed.createdAt) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      apiBaseUrl: parsed.apiBaseUrl,
      createdAt: parsed.createdAt,
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

export async function writeAuthFile(accessToken: string): Promise<AuthFile> {
  const authFile: AuthFile = {
    accessToken,
    apiBaseUrl: getApiBaseUrl(),
    createdAt: new Date().toISOString(),
  };
  const authFilePath = getAuthFilePath();

  await mkdir(path.dirname(authFilePath), { recursive: true, mode: 0o700 });
  await writeFile(authFilePath, `${JSON.stringify(authFile, null, 2)}\n`, {
    mode: 0o600,
  });
  await chmod(authFilePath, 0o600);

  return authFile;
}

export async function deleteAuthFile(): Promise<void> {
  await rm(getAuthFilePath(), { force: true });
}

