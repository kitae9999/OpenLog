import assert from "node:assert/strict";
import test from "node:test";
import { ApiError, OpenLogApiClient } from "../src/api-client.js";

test("refreshes once after a 401 and retries the original request", async (t) => {
  const calls: Array<{ url: string; cookie: string | null }> = [];
  let protectedRequestCount = 0;
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    calls.push({ url, cookie: headers.get("cookie") });

    if (url.endsWith("/auth/device/refresh")) {
      return Response.json({
        accessToken: "next-access-token",
        expiresIn: 3600,
        refreshToken: "next-refresh-token",
        refreshExpiresIn: 86400,
      });
    }

    protectedRequestCount += 1;
    if (protectedRequestCount === 1) {
      return Response.json({ message: "expired" }, { status: 401 });
    }
    return Response.json({ id: 7 });
  };

  let persistedRefreshToken: string | undefined;
  const client = new OpenLogApiClient({
    apiBaseUrl: "https://api.openlog.test",
    accessToken: "expired-access-token",
    refreshToken: "current-refresh-token",
    onTokenRefresh: (tokens) => {
      persistedRefreshToken = tokens.refreshToken;
    },
  });

  assert.deepEqual(await client.get("/auth/me"), { id: 7 });
  assert.equal(persistedRefreshToken, "next-refresh-token");
  assert.equal(calls.length, 3);
  assert.equal(calls[0].cookie, "openlog_access_token=expired-access-token");
  assert.equal(calls[2].cookie, "openlog_access_token=next-access-token");
});

test("keeps the original 401 when no refresh token is available", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () =>
    Response.json({ message: "expired" }, { status: 401 });

  const client = new OpenLogApiClient({
    apiBaseUrl: "https://api.openlog.test",
    accessToken: "legacy-access-token",
  });

  await assert.rejects(
    () => client.get("/auth/me"),
    (error) => error instanceof ApiError && error.status === 401,
  );
});

test("shares one refresh request across concurrent 401 responses", async (t) => {
  let refreshCount = 0;
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const cookie = new Headers(init?.headers).get("cookie");
    if (url.endsWith("/auth/device/refresh")) {
      refreshCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return Response.json({
        accessToken: "next-access-token",
        expiresIn: 3600,
        refreshToken: "next-refresh-token",
        refreshExpiresIn: 86400,
      });
    }
    if (cookie === "openlog_access_token=expired-access-token") {
      return Response.json({ message: "expired" }, { status: 401 });
    }
    return Response.json({ path: new URL(url).pathname });
  };

  const client = new OpenLogApiClient({
    apiBaseUrl: "https://api.openlog.test",
    accessToken: "expired-access-token",
    refreshToken: "current-refresh-token",
  });

  const responses = await Promise.all([
    client.get("/first"),
    client.get("/second"),
  ]);

  assert.equal(refreshCount, 1);
  assert.deepEqual(responses, [{ path: "/first" }, { path: "/second" }]);
});
