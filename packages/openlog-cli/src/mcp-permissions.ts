import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getMcpConfigFilePath } from "./config.js";

export const MCP_PERMISSION_PROFILES = [
  "read-only",
  "safe-write",
  "full",
] as const;

export type McpPermissionProfile =
  (typeof MCP_PERMISSION_PROFILES)[number];

export const MCP_CAPABILITIES = ["read", "write", "publish", "delete"] as const;

export type McpCapability = (typeof MCP_CAPABILITIES)[number];

export const DEFAULT_MCP_PERMISSION_PROFILE: McpPermissionProfile =
  "safe-write";

export type ResolvedMcpPermissions = {
  profile: McpPermissionProfile;
  capabilities: McpCapability[];
  configured: boolean;
  updatedAt: string | null;
};

type McpPermissionConfig = {
  version: 1;
  profile: McpPermissionProfile;
  updatedAt: string;
};

const PROFILE_CAPABILITIES: Record<
  McpPermissionProfile,
  readonly McpCapability[]
> = {
  // 프로필은 상위 프로필이 하위 capability를 모두 포함하도록 누적 구성한다.
  "read-only": ["read"],
  "safe-write": ["read", "write", "publish"],
  full: ["read", "write", "publish", "delete"],
};

export async function readMcpPermissions(): Promise<ResolvedMcpPermissions> {
  const filePath = getMcpConfigFilePath();
  let content: string;

  try {
    content = await readFile(filePath, "utf8");
  } catch (error) {
    if (hasErrorCode(error, "ENOENT")) {
      // 설정 파일이 없는 최초 실행은 기존 동작과 호환되는 safe-write를 사용한다.
      return resolvePermissions(DEFAULT_MCP_PERMISSION_PROFILE, false, null);
    }
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw invalidConfigError(filePath, "file is not valid JSON");
  }

  const config = parsePermissionConfig(parsed, filePath);
  return resolvePermissions(config.profile, true, config.updatedAt);
}

export async function writeMcpPermissionProfile(
  profile: McpPermissionProfile,
): Promise<ResolvedMcpPermissions> {
  const filePath = getMcpConfigFilePath();
  const config: McpPermissionConfig = {
    version: 1,
    profile,
    updatedAt: new Date().toISOString(),
  };

  await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  await writeFile(filePath, `${JSON.stringify(config, null, 2)}\n`, {
    mode: 0o600,
  });
  // 기존 파일을 덮어쓸 때도 소유자만 읽고 쓸 수 있도록 권한을 다시 고정한다.
  await chmod(filePath, 0o600);

  return resolvePermissions(profile, true, config.updatedAt);
}

export async function resetMcpPermissions(): Promise<ResolvedMcpPermissions> {
  await rm(getMcpConfigFilePath(), { force: true });
  return resolvePermissions(DEFAULT_MCP_PERMISSION_PROFILE, false, null);
}

export function isMcpPermissionProfile(
  value: string,
): value is McpPermissionProfile {
  return MCP_PERMISSION_PROFILES.some((profile) => profile === value);
}

export function hasMcpCapability(
  permissions: ResolvedMcpPermissions,
  capability: McpCapability,
): boolean {
  return permissions.capabilities.includes(capability);
}

function resolvePermissions(
  profile: McpPermissionProfile,
  configured: boolean,
  updatedAt: string | null,
): ResolvedMcpPermissions {
  return {
    profile,
    capabilities: [...PROFILE_CAPABILITIES[profile]],
    configured,
    updatedAt,
  };
}

function parsePermissionConfig(
  value: unknown,
  filePath: string,
): McpPermissionConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw invalidConfigError(filePath, "root value must be an object");
  }

  const config = value as Record<string, unknown>;
  if (config.version !== 1) {
    throw invalidConfigError(filePath, "version must be 1");
  }
  if (
    typeof config.profile !== "string" ||
    !isMcpPermissionProfile(config.profile)
  ) {
    throw invalidConfigError(
      filePath,
      `profile must be one of: ${MCP_PERMISSION_PROFILES.join(", ")}`,
    );
  }
  if (
    typeof config.updatedAt !== "string" ||
    !Number.isFinite(Date.parse(config.updatedAt))
  ) {
    throw invalidConfigError(filePath, "updatedAt must be an ISO date-time");
  }

  return {
    version: 1,
    profile: config.profile,
    updatedAt: config.updatedAt,
  };
}

function invalidConfigError(filePath: string, reason: string): Error {
  return new Error(
    `Invalid OpenLog MCP config at ${filePath}: ${reason}. Run \`openlog mcp permissions reset\` to restore the safe-write default.`,
  );
}

function hasErrorCode(error: unknown, code: string): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === code,
  );
}
