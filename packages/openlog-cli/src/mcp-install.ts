import { spawn, type StdioOptions } from "node:child_process";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  DEFAULT_API_BASE_URL,
  DEFAULT_WEB_BASE_URL,
  getApiBaseUrl,
  getWebBaseUrl,
} from "./config.js";

type McpInstallClient = "all" | "codex" | "claude-code" | "claude" | "cursor";

type McpInstallTarget = Exclude<McpInstallClient, "all" | "claude">;

export type McpInstallOptions = {
  client: McpInstallClient;
  printOnly: boolean;
};

export type ServerConfig = {
  command: string;
  args: string[];
  env: Record<string, string>;
};

type McpInstaller = (serverConfig: ServerConfig) => Promise<void>;

export type McpInstallDependencies = {
  installers?: Partial<Record<McpInstallTarget, McpInstaller>>;
};

const ALL_INSTALL_TARGETS: McpInstallTarget[] = [
  "codex",
  "claude-code",
  "cursor",
];

export async function installMcp(
  options: McpInstallOptions,
  dependencies: McpInstallDependencies = {},
): Promise<void> {
  const serverConfig = buildServerConfig();
  const client = options.client === "claude" ? "claude-code" : options.client;
  const installers: Record<McpInstallTarget, McpInstaller> = {
    codex: dependencies.installers?.codex ?? installCodex,
    "claude-code":
      dependencies.installers?.["claude-code"] ?? installClaudeCode,
    cursor: dependencies.installers?.cursor ?? installCursor,
  };

  if (options.printOnly) {
    if (client === "all") {
      for (const target of ALL_INSTALL_TARGETS) {
        console.log(`--- ${target} ---`);
        printConfig(target, serverConfig);
      }
      return;
    }

    printConfig(client, serverConfig);
    return;
  }

  if (client !== "all") {
    await installers[client](serverConfig);
    return;
  }

  const failures: string[] = [];
  for (const target of ALL_INSTALL_TARGETS) {
    try {
      await installers[target](serverConfig);
    } catch (error) {
      failures.push(`${target}: ${summarizeCommandError(error)}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `Some MCP client installations failed:\n${failures
        .map((failure) => `- ${failure}`)
        .join("\n")}`,
    );
  }
}

export function printMcpInstallHelp(): void {
  console.log(`OpenLog MCP install

Usage:
  openlog mcp install all
  openlog mcp install codex
  openlog mcp install claude-code
  openlog mcp install cursor
  openlog mcp install codex --print
  openlog mcp install claude-code --print
  openlog mcp install cursor --print

Aliases:
  claude      Same as claude-code

Notes:
  If OPENLOG_API_BASE_URL, OPENLOG_WEB_BASE_URL, or OPENLOG_MCP_CONFIG_FILE is set,
  it is added to the client config.
`);
}

function buildServerConfig(): ServerConfig {
  const apiBaseUrl = getApiBaseUrl();
  const webBaseUrl = getWebBaseUrl();
  const env: Record<string, string> = {};
  if (apiBaseUrl !== DEFAULT_API_BASE_URL) {
    env.OPENLOG_API_BASE_URL = apiBaseUrl;
  }
  if (webBaseUrl !== DEFAULT_WEB_BASE_URL) {
    env.OPENLOG_WEB_BASE_URL = webBaseUrl;
  }
  if (process.env.OPENLOG_MCP_CONFIG_FILE) {
    env.OPENLOG_MCP_CONFIG_FILE = process.env.OPENLOG_MCP_CONFIG_FILE;
  }

  return {
    command: "openlog",
    args: ["mcp"],
    env,
  };
}

async function installCodex(serverConfig: ServerConfig): Promise<void> {
  const args = ["mcp", "add", "openlog"];
  for (const [name, value] of Object.entries(serverConfig.env)) {
    args.push("--env", `${name}=${value}`);
  }
  args.push("--", serverConfig.command, ...serverConfig.args);

  let registeredWithCodexCli = false;
  try {
    registeredWithCodexCli =
      (await runCommand("codex", args, { stdio: "pipe" })) === "executed";
  } catch (error) {
    warnCodexFallback(error);
  }

  if (registeredWithCodexCli) {
    console.log("OpenLog MCP server registered with Codex.");
    console.log("Run `/mcp` inside Codex to confirm it is connected.");
    return;
  }

  await writeCodexConfig(serverConfig);
  console.log("OpenLog MCP server added to ~/.codex/config.toml.");
  console.log(
    "Restart Codex or reload MCP servers, then run `/mcp` to confirm.",
  );
}

async function installClaudeCode(serverConfig: ServerConfig): Promise<void> {
  const args = ["mcp", "add", "--transport", "stdio", "--scope", "user"];
  for (const [name, value] of Object.entries(serverConfig.env)) {
    args.push("--env", `${name}=${value}`);
  }
  args.push("openlog", "--", serverConfig.command, ...serverConfig.args);

  const result = await runCommand("claude", args);
  if (result !== "executed") {
    throw new Error(
      "Claude Code CLI was not found. Install Claude Code first, then run `openlog mcp install claude-code` again.",
    );
  }

  console.log("OpenLog MCP server registered with Claude Code.");
  console.log("Run `/mcp` inside Claude Code to confirm it is connected.");
}

export async function installCursor(
  serverConfig: ServerConfig,
  homeDirectory = os.homedir(),
): Promise<void> {
  const configPath = getCursorMcpConfigPath(homeDirectory);
  await mkdir(path.dirname(configPath), { recursive: true, mode: 0o700 });

  const currentConfig = await readTextIfExists(configPath);
  const nextConfig = upsertCursorServerConfig(
    currentConfig,
    serverConfig,
    configPath,
  );
  await writeFile(configPath, nextConfig, { mode: 0o600 });
  await chmod(configPath, 0o600);

  console.log("OpenLog MCP server added to ~/.cursor/mcp.json.");
  console.log("Open Cursor Settings > Tools & MCP to confirm it is connected.");
}

export function getCursorMcpConfigPath(homeDirectory = os.homedir()): string {
  return path.join(homeDirectory, ".cursor", "mcp.json");
}

async function writeCodexConfig(serverConfig: ServerConfig): Promise<void> {
  const configPath = path.join(os.homedir(), ".codex", "config.toml");
  await mkdir(path.dirname(configPath), { recursive: true, mode: 0o700 });

  const currentConfig = await readTextIfExists(configPath);
  const nextConfig = upsertCodexServerBlock(currentConfig, serverConfig);
  await writeFile(configPath, nextConfig, { mode: 0o600 });
}

function upsertCodexServerBlock(
  currentConfig: string,
  serverConfig: ServerConfig,
): string {
  const block = buildCodexServerBlock(serverConfig);
  const blockPattern =
    /(?:^|\n)\[mcp_servers\.openlog]\n[\s\S]*?(?:\n\[mcp_servers\.openlog\.env]\n[\s\S]*?)?(?=\n\[(?!mcp_servers\.openlog(?:\.env)?])[^\]]+]|\s*$)/;

  if (blockPattern.test(currentConfig)) {
    return currentConfig.replace(blockPattern, `\n${block}`).trimStart() + "\n";
  }

  const separator = currentConfig.trim().length === 0 ? "" : "\n\n";
  return `${currentConfig.trimEnd()}${separator}${block}\n`;
}

function buildCodexServerBlock(serverConfig: ServerConfig): string {
  const lines = [
    "[mcp_servers.openlog]",
    `command = ${tomlString(serverConfig.command)}`,
    `args = [${serverConfig.args.map(tomlString).join(", ")}]`,
  ];

  if (Object.keys(serverConfig.env).length > 0) {
    lines.push("");
    lines.push("[mcp_servers.openlog.env]");
    for (const [name, value] of Object.entries(serverConfig.env)) {
      lines.push(`${name} = ${tomlString(value)}`);
    }
  }

  return lines.join("\n");
}

export function upsertCursorServerConfig(
  currentConfig: string,
  serverConfig: ServerConfig,
  configPath = "~/.cursor/mcp.json",
): string {
  let parsed: unknown = {};
  if (currentConfig.trim().length > 0) {
    try {
      parsed = JSON.parse(currentConfig);
    } catch {
      throw new Error(
        `Invalid Cursor MCP config at ${configPath}: file is not valid JSON.`,
      );
    }
  }

  if (!isRecord(parsed)) {
    throw new Error(
      `Invalid Cursor MCP config at ${configPath}: root value must be an object.`,
    );
  }

  const existingServers = parsed.mcpServers;
  if (existingServers !== undefined && !isRecord(existingServers)) {
    throw new Error(
      `Invalid Cursor MCP config at ${configPath}: mcpServers must be an object.`,
    );
  }

  return `${JSON.stringify(
    {
      ...parsed,
      mcpServers: {
        ...(existingServers ?? {}),
        openlog: buildJsonServerConfig(serverConfig),
      },
    },
    null,
    2,
  )}\n`;
}

function printConfig(
  client: McpInstallClient,
  serverConfig: ServerConfig,
): void {
  if (client === "codex") {
    console.log(buildCodexServerBlock(serverConfig));
    return;
  }

  if (client === "cursor") {
    console.log(upsertCursorServerConfig("", serverConfig).trimEnd());
    return;
  }

  console.log(
    JSON.stringify(
      {
        type: "stdio",
        ...buildJsonServerConfig(serverConfig),
      },
      null,
      2,
    ),
  );
}

async function readTextIfExists(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return "";
    }

    throw error;
  }
}

function tomlString(value: string): string {
  return JSON.stringify(value);
}

function buildJsonServerConfig(serverConfig: ServerConfig) {
  return {
    command: serverConfig.command,
    args: serverConfig.args,
    env: serverConfig.env,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

class CommandFailedError extends Error {
  constructor(
    command: string,
    readonly exitCode: number | null,
    readonly stderr: string,
  ) {
    super(`${command} exited with code ${exitCode ?? "unknown"}.`);
  }
}

type RunCommandOptions = {
  stdio?: "inherit" | "pipe";
};

async function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): Promise<"executed" | "missing"> {
  return new Promise((resolve, reject) => {
    const stdioMode = options.stdio ?? "inherit";
    const stdio: StdioOptions =
      stdioMode === "pipe" ? ["ignore", "ignore", "pipe"] : "inherit";
    let stderr = "";

    const child = spawn(command, args, {
      stdio,
    });

    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        resolve("missing");
        return;
      }

      reject(error);
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve("executed");
        return;
      }

      reject(new CommandFailedError(command, code, stderr));
    });
  });
}

function warnCodexFallback(error: unknown): void {
  const reason = summarizeCommandError(error);
  const suffix = reason.length > 0 ? ` (${reason})` : "";
  console.warn(
    `Codex CLI registration failed${suffix}. Falling back to ~/.codex/config.toml.`,
  );
}

function summarizeCommandError(error: unknown): string {
  if (error instanceof CommandFailedError) {
    const firstStderrLine = error.stderr
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0);

    return truncateReason(firstStderrLine ?? error.message);
  }

  if (error instanceof Error) {
    return truncateReason(error.message);
  }

  return truncateReason(String(error));
}

function truncateReason(reason: string): string {
  return reason.length > 180 ? `${reason.slice(0, 177)}...` : reason;
}
