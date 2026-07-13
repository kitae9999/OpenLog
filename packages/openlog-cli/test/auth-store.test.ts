import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { readAuthFile, writeAuthFile } from "../src/auth-store.js";

test("continues to read legacy access-token-only auth files", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "openlog-auth-test-"));
  const authFilePath = path.join(directory, "auth.json");
  const previousAuthFile = process.env.OPENLOG_AUTH_FILE;
  process.env.OPENLOG_AUTH_FILE = authFilePath;
  t.after(async () => {
    if (previousAuthFile === undefined) delete process.env.OPENLOG_AUTH_FILE;
    else process.env.OPENLOG_AUTH_FILE = previousAuthFile;
    await rm(directory, { recursive: true, force: true });
  });
  await writeFile(
    authFilePath,
    JSON.stringify({
      accessToken: "legacy-access-token",
      apiBaseUrl: "https://api.openlog.test",
      createdAt: "2026-07-13T00:00:00.000Z",
    }),
  );

  const authFile = await readAuthFile();

  assert.equal(authFile?.accessToken, "legacy-access-token");
  assert.equal(authFile?.refreshToken, undefined);
});

test("stores refresh credentials and expiration timestamps", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "openlog-auth-test-"));
  const authFilePath = path.join(directory, "auth.json");
  const previousAuthFile = process.env.OPENLOG_AUTH_FILE;
  const previousApiBaseUrl = process.env.OPENLOG_API_BASE_URL;
  process.env.OPENLOG_AUTH_FILE = authFilePath;
  process.env.OPENLOG_API_BASE_URL = "https://api.openlog.test";
  t.after(async () => {
    if (previousAuthFile === undefined) delete process.env.OPENLOG_AUTH_FILE;
    else process.env.OPENLOG_AUTH_FILE = previousAuthFile;
    if (previousApiBaseUrl === undefined) delete process.env.OPENLOG_API_BASE_URL;
    else process.env.OPENLOG_API_BASE_URL = previousApiBaseUrl;
    await rm(directory, { recursive: true, force: true });
  });

  const authFile = await writeAuthFile({
    accessToken: "access-token",
    expiresIn: 3600,
    refreshToken: "refresh-token",
    refreshExpiresIn: 2592000,
  });

  assert.equal(authFile.refreshToken, "refresh-token");
  assert.equal(authFile.apiBaseUrl, "https://api.openlog.test");
  assert.ok(authFile.accessTokenExpiresAt);
  assert.ok(authFile.refreshTokenExpiresAt);
  assert.deepEqual(await readAuthFile(), authFile);
});
