import os from "node:os";
import path from "node:path";

export const DEFAULT_API_BASE_URL = "https://api.openlog.kr/api";
export const DEFAULT_WEB_BASE_URL = "https://openlog.kr";

export function getApiBaseUrl(): string {
  return (process.env.OPENLOG_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(
    /\/$/,
    "",
  );
}

export function getWebBaseUrl(): string {
  return (process.env.OPENLOG_WEB_BASE_URL ?? DEFAULT_WEB_BASE_URL).replace(
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

export function getMcpConfigFilePath(): string {
  return (
    process.env.OPENLOG_MCP_CONFIG_FILE ??
    path.join(os.homedir(), ".openlog", "mcp-config.json")
  );
}
