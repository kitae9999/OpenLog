#!/usr/bin/env node

import { deleteAuthFile, readAuthFile } from "./auth-store.js";
import { login } from "./login.js";
import { runMcpServer } from "./mcp-server.js";
import { installMcp, printMcpInstallHelp } from "./mcp-install.js";
import { ApiError, OpenLogApiClient } from "./api-client.js";
import { createAuthenticatedApiClient } from "./authenticated-client.js";
import { runMcpPermissionsCommand } from "./mcp-permissions-command.js";
import { runSetup } from "./setup.js";
import {
  banner,
  dim,
  formatError,
  heading,
  kv,
  success,
} from "./cli-ui.js";

const command = process.argv[2] ?? "setup";
const subcommand = process.argv[3];

try {
  if (command === "setup" || command === undefined) {
    await runSetup();
  } else if (command === "login") {
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
    client !== "all" &&
    client !== "codex" &&
    client !== "claude-code" &&
    client !== "claude" &&
    client !== "cursor"
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
  const asJson = process.argv.includes("--json");
  const apiClient = await createAuthenticatedApiClient();
  const me = (await apiClient.get("/auth/me")) as Record<string, unknown>;

  if (asJson) {
    console.log(JSON.stringify(me, null, 2));
    return;
  }

  const name =
    pickString(me, "nickname") ??
    pickString(me, "username") ??
    pickString(me, "name") ??
    "OpenLog user";
  const username = pickString(me, "username");
  const email = pickString(me, "email");
  const id = pickString(me, "id") ?? pickString(me, "userId");

  console.log(heading("Signed in"));
  console.log(kv("Name", name));
  if (username) {
    console.log(kv("Username", `@${username}`));
  }
  if (email) {
    console.log(kv("Email", email));
  }
  if (id) {
    console.log(kv("Id", String(id)));
  }
  console.log(dim("Tip: pass --json for machine-readable output."));
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
      console.error(
        formatError(`remote session revoke failed: ${formatCliError(error)}`),
      );
    }
  }

  await deleteAuthFile();
  console.log(success("Logged out."));
}

function printHelp(): void {
  console.log(banner());
  console.log("");
  console.log(heading("Usage"));
  console.log("");
  console.log(dim("Setup"));
  console.log(`  openlog                     Guided setup (login → agent → permissions)`);
  console.log(`  openlog setup               Same as above`);
  console.log("");
  console.log(dim("Auth"));
  console.log(`  openlog login              Sign in from the terminal`);
  console.log(`  openlog logout             Remove local credentials`);
  console.log(`  openlog whoami             Show the current user`);
  console.log(`  openlog whoami --json      Print raw /auth/me JSON`);
  console.log("");
  console.log(dim("MCP"));
  console.log(`  openlog mcp                Start the MCP stdio server`);
  console.log(`  openlog mcp install all`);
  console.log(`  openlog mcp install codex`);
  console.log(`  openlog mcp install claude-code`);
  console.log(`  openlog mcp install cursor`);
  console.log(`  openlog mcp permissions`);
  console.log(`  openlog mcp permissions set read-only|safe-write|full`);
  console.log(`  openlog mcp permissions reset`);
  console.log("");
  console.log(dim("Environment"));
  console.log(`  OPENLOG_API_BASE_URL       API base URL override`);
  console.log(`  OPENLOG_WEB_BASE_URL       Web origin for published post links`);
  console.log(`  OPENLOG_AUTH_FILE          Local auth file path`);
  console.log(`  OPENLOG_MCP_CONFIG_FILE    Local MCP permission config path`);
}

function formatCliError(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    const hint = error.url.includes("localhost:8080/auth/")
      ? "\n\nLocal hint: if your backend uses SERVER_SERVLET_CONTEXT_PATH=/api, run with OPENLOG_API_BASE_URL=http://localhost:8080/api."
      : "";

    return formatError(`${error.message}\nRequested: ${error.url}${hint}`);
  }

  return formatError(error instanceof Error ? error.message : String(error));
}

function pickString(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  const next = value[key];
  return typeof next === "string" && next.trim().length > 0 ? next : undefined;
}
