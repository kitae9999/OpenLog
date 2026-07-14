import assert from "node:assert/strict";
import test from "node:test";
import { runSetup } from "../src/setup.js";
import type { PromptIo } from "../src/prompt.js";
import type { AuthFile } from "../src/auth-store.js";
import type { ResolvedMcpPermissions } from "../src/mcp-permissions.js";

function scriptedPrompt(answers: string[]): PromptIo {
  const queue = [...answers];
  return {
    question: async () => {
      const next = queue.shift();
      if (next === undefined) {
        throw new Error("Unexpected prompt — answer queue empty");
      }
      return next;
    },
  };
}

function authFixture(): AuthFile {
  return {
    accessToken: "access",
    refreshToken: "refresh",
    apiBaseUrl: "https://api.example.test",
    createdAt: new Date().toISOString(),
  };
}

function permissionsFixture(
  overrides: Partial<ResolvedMcpPermissions> = {},
): ResolvedMcpPermissions {
  return {
    profile: "safe-write",
    capabilities: ["read", "write", "publish"],
    configured: false,
    updatedAt: null,
    ...overrides,
  };
}

test("setup refuses non-interactive terminals", async () => {
  await assert.rejects(
    () =>
      runSetup({
        isTTY: false,
      }),
    /interactive terminal/,
  );
});

test("setup logs in when unsigned, installs agent, sets permissions", async () => {
  const output: string[] = [];
  let loggedIn = false;
  let installedClient: string | null = null;
  let writtenProfile: string | null = null;

  await runSetup({
    isTTY: true,
    promptIo: scriptedPrompt(["y", "2", "2"]),
    writeOutput: (message) => output.push(message),
    readAuth: async () => null,
    login: async () => {
      loggedIn = true;
    },
    fetchMe: async () => ({ nickname: "kitae" }),
    installMcp: async ({ client }) => {
      installedClient = client;
    },
    readPermissions: async () => permissionsFixture(),
    writePermissionProfile: async (profile) => {
      writtenProfile = profile;
      return permissionsFixture({
        profile,
        configured: true,
        updatedAt: new Date().toISOString(),
      });
    },
  });

  assert.equal(loggedIn, true);
  assert.equal(installedClient, "codex");
  assert.equal(writtenProfile, "read-only");
  assert.match(output.join("\n"), /Setup complete/);
});

test("setup can install into all agents", async () => {
  let installedClient: string | null = null;

  await runSetup({
    isTTY: true,
    promptIo: scriptedPrompt(["1", "4"]),
    writeOutput: () => {},
    readAuth: async () => authFixture(),
    login: async () => {
      throw new Error("login should not run");
    },
    fetchMe: async () => ({ nickname: "kitae" }),
    installMcp: async ({ client }) => {
      installedClient = client;
    },
    readPermissions: async () =>
      permissionsFixture({ configured: true, profile: "safe-write" }),
    writePermissionProfile: async () => {
      throw new Error("should keep profile");
    },
  });

  assert.equal(installedClient, "all");
});

test("setup skips install and keeps profile when already signed in", async () => {
  const output: string[] = [];
  let installCalls = 0;
  let writeCalls = 0;

  await runSetup({
    isTTY: true,
    promptIo: scriptedPrompt(["5", "4"]),
    writeOutput: (message) => output.push(message),
    readAuth: async () => authFixture(),
    login: async () => {
      throw new Error("login should not run");
    },
    fetchMe: async () => ({ nickname: "kitae" }),
    installMcp: async () => {
      installCalls += 1;
    },
    readPermissions: async () =>
      permissionsFixture({ configured: true, profile: "full" }),
    writePermissionProfile: async () => {
      writeCalls += 1;
      return permissionsFixture({ configured: true, profile: "full" });
    },
  });

  assert.equal(installCalls, 0);
  assert.equal(writeCalls, 0);
  assert.match(output.join("\n"), /Signed in as kitae/);
  assert.match(output.join("\n"), /Keeping full/);
});

test("setup cancels when user declines login", async () => {
  await assert.rejects(
    () =>
      runSetup({
        isTTY: true,
        promptIo: scriptedPrompt(["n"]),
        writeOutput: () => {},
        readAuth: async () => null,
        login: async () => {
          throw new Error("login should not run");
        },
        fetchMe: async () => ({}),
        installMcp: async () => {},
        readPermissions: async () => permissionsFixture(),
        writePermissionProfile: async () => permissionsFixture(),
      }),
    /Setup cancelled/,
  );
});
