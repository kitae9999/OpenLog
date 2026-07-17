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

test("sends exchanged remote tokens as bearer authorization", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  let authorization: string | null = null;
  let cookie: string | null = null;
  globalThis.fetch = async (_input, init) => {
    const headers = new Headers(init?.headers);
    authorization = headers.get("authorization");
    cookie = headers.get("cookie");
    return Response.json({ ok: true });
  };

  const client = new OpenLogApiClient({
    apiBaseUrl: "https://api.openlog.test",
    accessToken: "internal-reference-token",
    authenticationMode: "bearer",
  });

  assert.deepEqual(await client.get("/auth/me"), { ok: true });
  assert.equal(authorization, "Bearer internal-reference-token");
  assert.equal(cookie, null);
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

test("supports PATCH responses and DELETE without content", async (t) => {
  const calls: Array<{ method: string; body?: string }> = [];
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (_input, init) => {
    calls.push({
      method: init?.method ?? "GET",
      ...(typeof init?.body === "string" ? { body: init.body } : {}),
    });
    if (init?.method === "PATCH") {
      return Response.json({ done: true });
    }
    return new Response(null, { status: 204 });
  };

  const client = new OpenLogApiClient({
    apiBaseUrl: "https://api.openlog.test",
    accessToken: "access-token",
  });

  assert.deepEqual(await client.patch("/todos/1", { done: true }), {
    done: true,
  });
  await client.deleteNoContent("/todos/1");
  assert.deepEqual(calls, [
    { method: "PATCH", body: JSON.stringify({ done: true }) },
    { method: "DELETE" },
  ]);
});

test("accepts an empty successful response with a non-204 status", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => new Response(null, { status: 201 });

  const client = new OpenLogApiClient({
    apiBaseUrl: "https://api.openlog.test",
  });
  await client.postNoContent("/workspaces/1/log-links", {
    fromLogId: 1,
    toLogId: 2,
    relation: "FIXES",
  });
});
