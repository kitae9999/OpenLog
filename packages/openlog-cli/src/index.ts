#!/usr/bin/env node

import { deleteAuthFile, readAuthFile } from "./auth-store.js";
import { login } from "./login.js";
import { runMcpServer } from "./mcp-server.js";
import { OpenLogApiClient } from "./api-client.js";

const command = process.argv[2] ?? "help";

try {
  if (command === "login") {
    await login();
  } else if (command === "logout") {
    await deleteAuthFile();
    console.log("Logged out.");
  } else if (command === "whoami") {
    await whoami();
  } else if (command === "mcp") {
    await runMcpServer();
  } else {
    printHelp();
    process.exit(command === "help" || command === "--help" || command === "-h" ? 0 : 1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

async function whoami(): Promise<void> {
  const authFile = await readAuthFile();

  if (!authFile) {
    throw new Error("Not logged in. Run `openlog login` first.");
  }

  const apiClient = new OpenLogApiClient({
    accessToken: authFile.accessToken,
    apiBaseUrl: authFile.apiBaseUrl,
  });
  const me = await apiClient.get("/auth/me");

  console.log(JSON.stringify(me, null, 2));
}

function printHelp(): void {
  console.log(`OpenLog CLI

Usage:
  openlog login    Sign in to OpenLog from the CLI
  openlog logout   Remove local OpenLog credentials
  openlog whoami   Print the current OpenLog user
  openlog mcp      Start the OpenLog MCP stdio server

Environment:
  OPENLOG_API_BASE_URL  Override the OpenLog API base URL
  OPENLOG_AUTH_FILE     Override the local auth file path
`);
}

