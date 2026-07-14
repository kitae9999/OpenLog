import {
  isMcpPermissionProfile,
  readMcpPermissions,
  resetMcpPermissions,
  writeMcpPermissionProfile,
  type ResolvedMcpPermissions,
} from "./mcp-permissions.js";
import { dim, heading, kv } from "./cli-ui.js";

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
    writeOutput(dim("Restart or reload the OpenLog MCP server to apply this profile."));
    return;
  }

  if (action === "reset" && args.length === 1) {
    const permissions = await resetMcpPermissions();
    writeOutput(formatPermissions(permissions));
    writeOutput(dim("Restart or reload the OpenLog MCP server to apply this profile."));
    return;
  }

  throw new Error(permissionUsage());
}

export function permissionUsage(): string {
  return [
    heading("OpenLog MCP permissions"),
    "",
    dim("Usage"),
    "  openlog mcp permissions",
    "  openlog mcp permissions show",
    "  openlog mcp permissions set read-only",
    "  openlog mcp permissions set safe-write",
    "  openlog mcp permissions set full",
    "  openlog mcp permissions reset",
  ].join("\n");
}

function formatPermissions(permissions: ResolvedMcpPermissions): string {
  return [
    heading("MCP permissions"),
    kv("Profile", permissions.profile),
    kv("Capabilities", permissions.capabilities.join(", ")),
    kv("Source", permissions.configured ? "local config" : "default"),
    ...(permissions.updatedAt
      ? [kv("Updated", permissions.updatedAt)]
      : []),
  ].join("\n");
}
