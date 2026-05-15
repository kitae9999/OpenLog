import os from "node:os";
import path from "node:path";

const DEFAULT_API_BASE_URL = "https://api.openlog.kr/api";

export function getApiBaseUrl(): string {
  return (process.env.OPENLOG_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(
    /\/$/,
    "",
  );
}

export function getAuthFilePath(): string {
  return (
    process.env.OPENLOG_AUTH_FILE ??
    path.join(os.homedir(), ".openlog", "auth.json")
  );
}

