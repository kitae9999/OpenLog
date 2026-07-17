import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { pathToFileURL } from "node:url";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { createOpenLogMcpServer } from "./mcp-server.js";
import {
  createRemoteApiClientFactory,
  introspectRemoteAccess,
  loadRemoteMcpConfig,
  readBearerToken,
  RemoteAuthError,
  type RemoteMcpConfig,
} from "./remote-auth.js";
import { RemoteMcpMetrics } from "./remote-metrics.js";

type AuthenticatedRequest = IncomingMessage & { auth?: AuthInfo };

export function createRemoteMcpHttpServer(
  config: RemoteMcpConfig,
  request: typeof fetch = fetch,
) {
  const metrics = new RemoteMcpMetrics(config.enabled);
  return createServer(async (incoming, response) => {
    const url = new URL(
      incoming.url ?? "/",
      `http://${incoming.headers.host ?? "localhost"}`,
    );
    if (url.pathname === "/healthz") {
      writeJson(response, 200, {
        status: config.enabled ? "ready" : "disabled",
      });
      return;
    }
    if (url.pathname === "/metrics") {
      response.writeHead(200, { "content-type": "text/plain; version=0.0.4" });
      response.end(metrics.render());
      return;
    }
    if (url.pathname !== "/mcp") {
      writeJson(response, 404, { error: "not_found" });
      return;
    }
    if (!config.enabled) {
      writeJson(response, 503, { error: "remote_mcp_disabled" });
      return;
    }
    metrics.beginRequest();
    const startedAt = performance.now();
    let failed = false;
    try {
      const token = readBearerToken(incoming.headers.authorization);
      const introspectionStartedAt = performance.now();
      const access = await introspectRemoteAccess(token, config, request).then(
        (result) => {
          metrics.recordIntrospection(
            "success",
            performance.now() - introspectionStartedAt,
          );
          return result;
        },
        (error) => {
          metrics.recordIntrospection(
            "failure",
            performance.now() - introspectionStartedAt,
          );
          throw error;
        },
      );
      metrics.recordAuthentication("success", "none");
      if (incoming.method !== "POST") {
        writeRpcError(response, 405, -32000, "Method not allowed.");
        return;
      }
      const body = await readJsonBody(incoming);
      const authenticatedRequest = incoming as AuthenticatedRequest;
      authenticatedRequest.auth = {
        token,
        clientId: access.clientId,
        scopes: ["mcp:tools"],
        expiresAt: access.expiresAt,
        resource: new URL(config.resource),
        extra: {
          userId: access.userId,
          connectionId: access.connectionId,
          permissionProfile: access.permissions.profile,
        },
      };

      const created = await createOpenLogMcpServer({
        runtime: "remote",
        permissions: access.permissions,
        createAuthenticatedClient: createRemoteApiClientFactory(
          access,
          config,
          request,
          (outcome, durationMs) =>
            metrics.recordTokenExchange(outcome, durationMs),
        ),
        apiBaseUrl: config.apiBaseUrl,
        webBaseUrl: config.webBaseUrl,
        toolObserver: metrics,
      });
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      try {
        await created.server.connect(transport);
        await transport.handleRequest(authenticatedRequest, response, body);
      } finally {
        await transport.close().catch(() => undefined);
        await created.server.close().catch(() => undefined);
      }
    } catch (error) {
      failed = true;
      if (error instanceof RemoteAuthError) {
        if (error.category === "token_exchange") {
          writeRpcError(
            response,
            502,
            -32603,
            "OpenLog API authentication failed.",
          );
        } else {
          metrics.recordAuthentication("failure", error.category);
          writeUnauthorized(response, config, error.message);
        }
      } else if (!response.headersSent) {
        writeRpcError(response, 500, -32603, "Internal server error.");
      }
    } finally {
      metrics.recordRequest(
        performance.now() - startedAt,
        failed || response.statusCode >= 400 ? "failure" : "success",
        response.statusCode,
      );
    }
  });
}

export async function runRemoteMcpServer(): Promise<void> {
  const config = loadRemoteMcpConfig();
  const server = createRemoteMcpHttpServer(config);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.host, () => resolve());
  });
  console.error(
    `OpenLog remote MCP listening on ${config.host}:${config.port}`,
  );
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      throw new Error("MCP request body is too large.");
    }
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : undefined;
}

function writeUnauthorized(
  response: ServerResponse,
  config: RemoteMcpConfig,
  message: string,
) {
  if (response.headersSent) return;
  response.writeHead(401, {
    "content-type": "application/json; charset=utf-8",
    "www-authenticate": `Bearer resource_metadata="${config.resourceMetadataUrl}", scope="mcp:tools"`,
  });
  response.end(
    JSON.stringify({ error: "invalid_token", error_description: message }),
  );
}

function writeRpcError(
  response: ServerResponse,
  status: number,
  code: number,
  message: string,
) {
  if (response.headersSent) return;
  writeJson(response, status, {
    jsonrpc: "2.0",
    error: { code, message },
    id: null,
  });
}

function writeJson(response: ServerResponse, status: number, body: unknown) {
  if (response.headersSent) return;
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

const MAX_BODY_BYTES = 1024 * 1024;
const executedPath = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (executedPath === import.meta.url) {
  runRemoteMcpServer().catch(() => {
    console.error("OpenLog remote MCP failed to start.");
    process.exitCode = 1;
  });
}
