#!/usr/bin/env node

import { deleteAuthFile, readAuthFile } from "./auth-store.js";
import { login } from "./login.js";
import { runMcpServer } from "./mcp-server.js";
import { installMcp, printMcpInstallHelp } from "./mcp-install.js";
import { ApiError, OpenLogApiClient } from "./api-client.js";
import { createAuthenticatedApiClient } from "./authenticated-client.js";
import { runMcpPermissionsCommand } from "./mcp-permissions-command.js";

const command = process.argv[2] ?? "help";
const subcommand = process.argv[3];

try {
  if (command === "login") {
    await login();
  } else if (command === "logout") {
    await logout();
  } else if (command === "whoami") {
    await whoami();
  } else if (command === "mcp") {
    if (subcommand === "install") {
      await installMcpCommand();
    } else if (subcommand === "permissions") {
      await runMcpPermissionsCommand(process.argv.slice(4));
    } else if (
      subcommand === undefined ||
      subcommand === "serve" ||
      subcommand === "start"
    ) {
      await runMcpServer();
    } else {
      printMcpInstallHelp();
      process.exit(1);
    }
  } else {
    printHelp();
    process.exit(command === "help" || command === "--help" || command === "-h" ? 0 : 1);
  }
} catch (error) {
  console.error(formatCliError(error));
  process.exit(1);
}

async function installMcpCommand(): Promise<void> {
  const client = process.argv[4];
  const printOnly = process.argv.includes("--print");

  if (
    client !== "codex" &&
    client !== "claude-code" &&
    client !== "claude"
  ) {
    printMcpInstallHelp();
    process.exit(1);
  }

  await installMcp({
    client,
    printOnly,
  });
}

async function whoami(): Promise<void> {
  const apiClient = await createAuthenticatedApiClient();
  const me = await apiClient.get("/auth/me");

  console.log(JSON.stringify(me, null, 2));
}

async function logout(): Promise<void> {
  const authFile = await readAuthFile();

  if (authFile?.refreshToken) {
    try {
      const apiClient = new OpenLogApiClient({
        apiBaseUrl: authFile.apiBaseUrl,
      });
      await apiClient.postNoContent("/auth/device/revoke", {
        refreshToken: authFile.refreshToken,
      });
    } catch (error) {
      console.error(`Warning: remote session revoke failed: ${formatCliError(error)}`);
    }
  }

  await deleteAuthFile();
  console.log("Logged out.");
}

function printHelp(): void {
  console.log(`OpenLog CLI

Usage:
  openlog login    Sign in to OpenLog from the CLI
  openlog logout   Remove local OpenLog credentials
  openlog whoami   Print the current OpenLog user
  openlog mcp      Start the OpenLog MCP stdio server
  openlog mcp install codex
                  Register OpenLog MCP with Codex
  openlog mcp install claude-code
                  Register OpenLog MCP with Claude Code
  openlog mcp permissions
                  Show the active local MCP permission profile
  openlog mcp permissions set read-only|safe-write|full
                  Change the local MCP permission profile
  openlog mcp permissions reset
                  Restore the default safe-write profile

Environment:
  OPENLOG_API_BASE_URL  Override the OpenLog API base URL
  OPENLOG_WEB_BASE_URL  Override the OpenLog web base URL for published post links
  OPENLOG_AUTH_FILE     Override the local auth file path
  OPENLOG_MCP_CONFIG_FILE
                        Override the local MCP permission config path
`);
}

function formatCliError(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    const hint = error.url.includes("localhost:8080/auth/")
      ? "\n\nLocal hint: if your backend uses SERVER_SERVLET_CONTEXT_PATH=/api, run with OPENLOG_API_BASE_URL=http://localhost:8080/api."
      : "";

    return `${error.message}\nRequested: ${error.url}${hint}`;
  }

  return error instanceof Error ? error.message : String(error);
}
