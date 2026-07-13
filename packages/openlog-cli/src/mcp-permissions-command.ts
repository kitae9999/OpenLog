import {
  isMcpPermissionProfile,
  readMcpPermissions,
  resetMcpPermissions,
  writeMcpPermissionProfile,
  type ResolvedMcpPermissions,
} from "./mcp-permissions.js";

export async function runMcpPermissionsCommand(
  args: string[],
  writeOutput: (message: string) => void = console.log,
): Promise<void> {
  const action = args[0] ?? "show";

  if ((action === "show" && args.length === 1) || args.length === 0) {
    writeOutput(formatPermissions(await readMcpPermissions()));
    return;
  }

  if (action === "set" && args.length === 2) {
    const profile = args[1];
    if (!isMcpPermissionProfile(profile)) {
      throw new Error(permissionUsage());
    }
    const permissions = await writeMcpPermissionProfile(profile);
    writeOutput(formatPermissions(permissions));
    // 실행 중인 MCP server는 시작 시 권한을 확정하므로 재시작 안내가 필요하다.
    writeOutput("Restart or reload the OpenLog MCP server to apply this profile.");
    return;
  }

  if (action === "reset" && args.length === 1) {
    const permissions = await resetMcpPermissions();
    writeOutput(formatPermissions(permissions));
    writeOutput("Restart or reload the OpenLog MCP server to apply this profile.");
    return;
  }

  throw new Error(permissionUsage());
}

export function permissionUsage(): string {
  return `OpenLog MCP permissions

Usage:
  openlog mcp permissions
  openlog mcp permissions show
  openlog mcp permissions set read-only
  openlog mcp permissions set safe-write
  openlog mcp permissions set full
  openlog mcp permissions reset`;
}

function formatPermissions(permissions: ResolvedMcpPermissions): string {
  return [
    `Profile: ${permissions.profile}`,
    `Capabilities: ${permissions.capabilities.join(", ")}`,
    `Source: ${permissions.configured ? "local config" : "default"}`,
    ...(permissions.updatedAt ? [`Updated: ${permissions.updatedAt}`] : []),
  ].join("\n");
}
