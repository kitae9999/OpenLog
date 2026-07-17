import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";
import { createRemoteMcpHttpServer } from "../src/remote-server.js";
import type { RemoteMcpConfig } from "../src/remote-auth.js";

test("returns RFC 9728 discovery information for unauthenticated MCP requests", async (t) => {
  const server = createRemoteMcpHttpServer(config);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  const address = server.address() as AddressInfo;

  const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "test", version: "1.0.0" },
      },
    }),
  });

  assert.equal(response.status, 401);
  assert.match(
    response.headers.get("www-authenticate") ?? "",
    /resource_metadata="https:\/\/api\.openlog\.test\/\.well-known\/oauth-protected-resource\/mcp"/,
  );

  const unauthenticatedGet = await fetch(
    `http://127.0.0.1:${address.port}/mcp`,
  );
  assert.equal(unauthenticatedGet.status, 401);
});

test("serves a stateless safe-write tool catalogue after bearer introspection", async (t) => {
  const server = createRemoteMcpHttpServer(config, async (input) => {
    assert.equal(String(input), config.introspectionUrl);
    return Response.json({
      active: true,
      client_id: "codex",
      scope: "mcp:tools",
      aud: [config.resource],
      exp: Math.floor(Date.now() / 1000) + 300,
      user_id: 41,
      connection_id: "f5a4a963-b965-4c50-aa6a-dda5307c2a53",
      permission_profile: "safe-write",
      capabilities: ["read", "write", "publish"],
      token_use: "mcp_access",
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  const address = server.address() as AddressInfo;
  const endpoint = `http://127.0.0.1:${address.port}/mcp`;

  const initialize = await rpc(endpoint, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "test", version: "1.0.0" },
    },
  });
  assert.equal(initialize.status, 200);
  assert.equal((await initialize.json()).result.serverInfo.name, "openlog");

  const toolsResponse = await rpc(endpoint, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  });
  assert.equal(toolsResponse.status, 200);
  const body = await toolsResponse.json();
  const names = body.result.tools.map((tool: { name: string }) => tool.name);
  assert.ok(names.includes("start_openlog_session"));
  assert.ok(!names.includes("upload_post_image"));
  assert.ok(!names.some((name: string) => name.startsWith("delete_")));

  const metrics = await fetch(
    `http://127.0.0.1:${address.port}/metrics`,
  ).then((response) => response.text());
  assert.match(
    metrics,
    /openlog_mcp_requests_total\{outcome="success"} 2/,
  );
  assert.match(
    metrics,
    /openlog_mcp_authentication_total\{outcome="success",reason="none"} 2/,
  );
  assert.match(
    metrics,
    /openlog_mcp_introspection_duration_seconds_count\{outcome="success"} 2/,
  );
});

function rpc(endpoint: string, body: unknown) {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      authorization: "Bearer access-token",
      "content-type": "application/json",
      "mcp-protocol-version": "2025-11-25",
    },
    body: JSON.stringify(body),
  });
}

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
