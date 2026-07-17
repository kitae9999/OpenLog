import assert from "node:assert/strict";
import test from "node:test";
import {
  createRemoteApiClientFactory,
  introspectRemoteAccess,
  RemoteAuthError,
  type RemoteAccess,
  type RemoteMcpConfig,
} from "../src/remote-auth.js";

test("keeps concurrent remote users and exchanged tokens isolated", async () => {
  const apiCalls: Array<{ path: string; authorization: string | null }> = [];
  const request: typeof fetch = async (input, init) => {
    const url = String(input);
    const body = new URLSearchParams(String(init?.body ?? ""));
    if (url === config.introspectionUrl) {
      const token = body.get("token");
      const suffix = token === "user-one-token" ? "one" : "two";
      return Response.json({
        active: true,
        client_id: `client-${suffix}`,
        scope: "mcp:tools",
        aud: [config.resource],
        user_id: suffix === "one" ? 1 : 2,
        connection_id: `connection-${suffix}`,
        permission_profile: suffix === "one" ? "read-only" : "safe-write",
        capabilities:
          suffix === "one" ? ["read"] : ["read", "write", "publish"],
        token_use: "mcp_access",
      });
    }
    if (url === config.tokenUrl) {
      const subject = body.get("subject_token");
      return Response.json({
        access_token: `internal-${subject}`,
        token_type: "Bearer",
        expires_in: 60,
      });
    }
    apiCalls.push({
      path: new URL(url).pathname,
      authorization: new Headers(init?.headers).get("authorization"),
    });
    return Response.json({ ok: true });
  };

  const [one, two] = await Promise.all([
    introspectRemoteAccess("user-one-token", config, request),
    introspectRemoteAccess("user-two-token", config, request),
  ]);
  assert.equal(one.userId, "1");
  assert.equal(one.permissions.profile, "read-only");
  assert.equal(two.userId, "2");
  assert.equal(two.permissions.profile, "safe-write");

  const [oneClient, twoClient] = await Promise.all([
    createRemoteApiClientFactory(one, config, request)(),
    createRemoteApiClientFactory(two, config, request)(),
  ]);
  await Promise.all([oneClient.get("/auth/me"), twoClient.get("/auth/me")]);
  assert.deepEqual(apiCalls, [
    {
      path: "/api/auth/me",
      authorization: "Bearer internal-user-one-token",
    },
    {
      path: "/api/auth/me",
      authorization: "Bearer internal-user-two-token",
    },
  ]);
});

test("reports a failed internal token exchange without exposing the subject token", async () => {
  const outcomes: string[] = [];
  const access: RemoteAccess = {
    token: "sensitive-subject-token",
    clientId: "client",
    userId: "1",
    connectionId: "connection",
    permissions: {
      profile: "safe-write",
      capabilities: ["read", "write", "publish"],
      configured: true,
      updatedAt: null,
    },
  };
  const createClient = createRemoteApiClientFactory(
    access,
    config,
    async () => new Response(null, { status: 503 }),
    (outcome) => {
      outcomes.push(outcome);
    },
  );

  await assert.rejects(createClient, (error: unknown) => {
    assert.ok(error instanceof RemoteAuthError);
    assert.equal(error.category, "token_exchange");
    assert.ok(!error.message.includes(access.token));
    return true;
  });
  assert.deepEqual(outcomes, ["failure"]);
});

const config: RemoteMcpConfig = {
  enabled: true,
  host: "127.0.0.1",
  port: 8090,
  apiBaseUrl: "https://internal.openlog.test/api",
  webBaseUrl: "https://openlog.test",
  resource: "https://api.openlog.test/mcp",
  resourceMetadataUrl:
    "https://api.openlog.test/.well-known/oauth-protected-resource/mcp",
  internalApiResource: "https://api.openlog.test/api",
  introspectionUrl: "https://internal.openlog.test/api/oauth2/introspect",
  tokenUrl: "https://internal.openlog.test/api/oauth2/token",
  serviceClientId: "openlog-mcp-service",
  serviceClientSecret: "secret",
};
