import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runMcpPermissionsCommand } from "../src/mcp-permissions-command.js";
import {
  readMcpPermissions,
  resetMcpPermissions,
  writeMcpPermissionProfile,
} from "../src/mcp-permissions.js";

test("uses safe-write when no MCP permission config exists", async (t) => {
  const fixture = await createConfigFixture(t);

  assert.deepEqual(await readMcpPermissions(), {
    profile: "safe-write",
    capabilities: ["read", "write", "publish"],
    configured: false,
    updatedAt: null,
  });
  await assert.rejects(() => readFile(fixture.filePath, "utf8"), {
    code: "ENOENT",
  });
});

test("writes, reads, and resets an MCP permission profile", async (t) => {
  const fixture = await createConfigFixture(t);

  const written = await writeMcpPermissionProfile("full");
  assert.equal(written.profile, "full");
  assert.deepEqual(written.capabilities, ["read", "write", "publish", "delete"]);
  assert.equal(written.configured, true);
  assert.ok(written.updatedAt);

  const stored = JSON.parse(await readFile(fixture.filePath, "utf8"));
  assert.equal(stored.version, 1);
  assert.equal(stored.profile, "full");
  assert.equal((await stat(fixture.filePath)).mode & 0o777, 0o600);
  assert.deepEqual(await readMcpPermissions(), written);

  assert.deepEqual(await resetMcpPermissions(), {
    profile: "safe-write",
    capabilities: ["read", "write", "publish"],
    configured: false,
    updatedAt: null,
  });
});

test("rejects malformed or unsupported MCP permission configs", async (t) => {
  const fixture = await createConfigFixture(t);
  const invalidConfigs = [
    "not-json",
    JSON.stringify({ version: 2, profile: "safe-write", updatedAt: new Date().toISOString() }),
    JSON.stringify({ version: 1, profile: "admin", updatedAt: new Date().toISOString() }),
    JSON.stringify({ version: 1, profile: "full", updatedAt: "not-a-date" }),
  ];

  for (const content of invalidConfigs) {
    await writeFile(fixture.filePath, content);
    await assert.rejects(
      () => readMcpPermissions(),
      /Invalid OpenLog MCP config.*permissions reset/,
    );
  }
});

test("runs show, set, and reset permission commands", async (t) => {
  await createConfigFixture(t);
  const output: string[] = [];
  const writeOutput = (message: string) => output.push(message);

  await runMcpPermissionsCommand(["set", "read-only"], writeOutput);
  assert.match(output.join("\n"), /Profile: read-only/);
  assert.match(output.join("\n"), /Restart or reload/);

  output.length = 0;
  await runMcpPermissionsCommand(["show"], writeOutput);
  assert.match(output.join("\n"), /Capabilities: read/);
  assert.match(output.join("\n"), /Source: local config/);

  output.length = 0;
  await runMcpPermissionsCommand(["reset"], writeOutput);
  assert.match(output.join("\n"), /Profile: safe-write/);
  assert.match(output.join("\n"), /Source: default/);
});

async function createConfigFixture(t: test.TestContext) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "openlog-mcp-config-test-"));
  const filePath = path.join(directory, "mcp-config.json");
  const previousConfigFile = process.env.OPENLOG_MCP_CONFIG_FILE;
  process.env.OPENLOG_MCP_CONFIG_FILE = filePath;

  t.after(async () => {
    if (previousConfigFile === undefined) {
      delete process.env.OPENLOG_MCP_CONFIG_FILE;
    } else {
      process.env.OPENLOG_MCP_CONFIG_FILE = previousConfigFile;
    }
    await rm(directory, { recursive: true, force: true });
  });

  return { directory, filePath };
}
