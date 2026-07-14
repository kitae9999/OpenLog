import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  getCursorMcpConfigPath,
  installCursor,
  installMcp,
  upsertCursorServerConfig,
  type ServerConfig,
} from "../src/mcp-install.js";

const SERVER_CONFIG: ServerConfig = {
  command: "openlog",
  args: ["mcp"],
  env: {
    OPENLOG_API_BASE_URL: "https://api.example.com/api",
  },
};

test("uses Cursor's global MCP configuration path", () => {
  assert.equal(
    getCursorMcpConfigPath("/Users/openlog"),
    "/Users/openlog/.cursor/mcp.json",
  );
});

test("writes the Cursor config with owner-only permissions", async (t) => {
  const homeDirectory = await mkdtemp(
    path.join(os.tmpdir(), "openlog-cursor-install-"),
  );
  t.after(() => rm(homeDirectory, { recursive: true, force: true }));

  await installCursor(SERVER_CONFIG, homeDirectory);

  const configPath = getCursorMcpConfigPath(homeDirectory);
  const config = JSON.parse(await readFile(configPath, "utf8"));
  const configStat = await stat(configPath);
  assert.deepEqual(config.mcpServers.openlog, SERVER_CONFIG);
  assert.equal(configStat.mode & 0o777, 0o600);
});

test("creates a Cursor global MCP config for OpenLog", () => {
  const result = JSON.parse(upsertCursorServerConfig("", SERVER_CONFIG));

  assert.deepEqual(result, {
    mcpServers: {
      openlog: SERVER_CONFIG,
    },
  });
});

test("preserves existing Cursor config while replacing only the OpenLog server", () => {
  const currentConfig = JSON.stringify({
    version: 1,
    mcpServers: {
      existing: {
        command: "existing-server",
        args: [],
      },
      openlog: {
        command: "old-openlog",
        args: [],
      },
    },
  });

  const result = JSON.parse(
    upsertCursorServerConfig(currentConfig, SERVER_CONFIG),
  );

  assert.equal(result.version, 1);
  assert.deepEqual(result.mcpServers.existing, {
    command: "existing-server",
    args: [],
  });
  assert.deepEqual(result.mcpServers.openlog, SERVER_CONFIG);
});

test("rejects invalid Cursor config instead of overwriting it", () => {
  assert.throws(
    () => upsertCursorServerConfig("{", SERVER_CONFIG),
    /file is not valid JSON/,
  );
  assert.throws(
    () => upsertCursorServerConfig("[]", SERVER_CONFIG),
    /root value must be an object/,
  );
  assert.throws(
    () =>
      upsertCursorServerConfig(
        JSON.stringify({ mcpServers: [] }),
        SERVER_CONFIG,
      ),
    /mcpServers must be an object/,
  );
});

test("installs a self-contained npx MCP command", async () => {
  let installedConfig: ServerConfig | undefined;

  await installMcp(
    { client: "codex", printOnly: false },
    {
      installers: {
        codex: async (serverConfig) => {
          installedConfig = serverConfig;
        },
      },
    },
  );

  assert.equal(installedConfig?.command, "npx");
  assert.deepEqual(installedConfig?.args, ["-y", "@openloghq/cli", "mcp"]);
});

test("all installs every client and reports failures after continuing", async () => {
  const calls: string[] = [];

  await assert.rejects(
    installMcp(
      { client: "all", printOnly: false },
      {
        installers: {
          codex: async () => {
            calls.push("codex");
          },
          "claude-code": async () => {
            calls.push("claude-code");
            throw new Error("Claude CLI unavailable");
          },
          cursor: async () => {
            calls.push("cursor");
          },
        },
      },
    ),
    /claude-code: Claude CLI unavailable/,
  );

  assert.deepEqual(calls, ["codex", "claude-code", "cursor"]);
});
