import { OpenLogApiClient } from "./api-client.js";
import {
  isMcpPermissionProfile,
  type McpPermissionProfile,
  type ResolvedMcpPermissions,
} from "./mcp-permissions.js";

export type RemoteMcpConfig = {
  enabled: boolean;
  host: string;
  port: number;
  apiBaseUrl: string;
  webBaseUrl: string;
  resource: string;
  resourceMetadataUrl: string;
  internalApiResource: string;
  introspectionUrl: string;
  tokenUrl: string;
  serviceClientId: string;
  serviceClientSecret: string;
};

export type RemoteAccess = {
  token: string;
  clientId: string;
  userId: string;
  connectionId: string;
  expiresAt?: number;
  permissions: ResolvedMcpPermissions;
};

type IntrospectionResponse = {
  active?: boolean;
  client_id?: string;
  scope?: string;
  aud?: string | string[];
  exp?: number;
  user_id?: string | number;
  connection_id?: string;
  permission_profile?: string;
  capabilities?: string[];
  token_use?: string;
};

type TokenExchangeResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
};

export class RemoteAuthError extends Error {
  constructor(
    message: string,
    readonly category: "missing_token" | "invalid_token" | "token_exchange",
  ) {
    super(message);
    this.name = "RemoteAuthError";
  }
}

export function loadRemoteMcpConfig(
  environment: NodeJS.ProcessEnv = process.env,
): RemoteMcpConfig {
  const issuer = required(
    environment.MCP_OAUTH_ISSUER,
    "MCP_OAUTH_ISSUER",
  ).replace(/\/$/, "");
  const resource = required(
    environment.MCP_PUBLIC_RESOURCE,
    "MCP_PUBLIC_RESOURCE",
  );
  return {
    enabled: environment.MCP_REMOTE_ENABLED === "true",
    host: environment.MCP_HOST ?? "0.0.0.0",
    port: parsePort(environment.MCP_PORT ?? "8090"),
    apiBaseUrl: required(
      environment.OPENLOG_API_BASE_URL,
      "OPENLOG_API_BASE_URL",
    ),
    webBaseUrl: environment.OPENLOG_WEB_BASE_URL ?? "https://openlog.kr",
    resource,
    resourceMetadataUrl:
      environment.MCP_RESOURCE_METADATA_URL ??
      `${issuer}/.well-known/oauth-protected-resource/mcp`,
    internalApiResource: required(
      environment.MCP_INTERNAL_API_RESOURCE,
      "MCP_INTERNAL_API_RESOURCE",
    ),
    introspectionUrl:
      environment.MCP_INTROSPECTION_URL ?? `${issuer}/oauth2/introspect`,
    tokenUrl: environment.MCP_TOKEN_URL ?? `${issuer}/oauth2/token`,
    serviceClientId: required(
      environment.MCP_SERVICE_CLIENT_ID,
      "MCP_SERVICE_CLIENT_ID",
    ),
    serviceClientSecret: required(
      environment.MCP_SERVICE_CLIENT_SECRET,
      "MCP_SERVICE_CLIENT_SECRET",
    ),
  };
}

export function readBearerToken(authorization: string | undefined): string {
  if (!authorization?.startsWith("Bearer ")) {
    throw new RemoteAuthError(
      "Bearer authentication is required.",
      "missing_token",
    );
  }
  const token = authorization.slice("Bearer ".length).trim();
  if (!token || token.includes(" ")) {
    throw new RemoteAuthError(
      "Bearer authentication is invalid.",
      "invalid_token",
    );
  }
  return token;
}

export async function introspectRemoteAccess(
  token: string,
  config: RemoteMcpConfig,
  request: typeof fetch = fetch,
): Promise<RemoteAccess> {
  const response = await request(config.introspectionUrl, {
    method: "POST",
    headers: {
      authorization: basicAuthentication(config),
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ token }),
  });
  if (!response.ok) {
    throw new RemoteAuthError("Token introspection failed.", "invalid_token");
  }

  const body = (await response.json()) as IntrospectionResponse;
  const profile = body.permission_profile;
  const scopes = new Set((body.scope ?? "").split(/\s+/).filter(Boolean));
  if (
    body.active !== true ||
    body.token_use !== "mcp_access" ||
    !profile ||
    !isMcpPermissionProfile(profile) ||
    !scopes.has("mcp:tools") ||
    !hasAudience(body.aud, config.resource) ||
    body.user_id == null ||
    !body.connection_id
  ) {
    throw new RemoteAuthError(
      "The MCP access token is inactive or invalid.",
      "invalid_token",
    );
  }

  const permissions = permissionsFor(profile, body.capabilities);
  return {
    token,
    clientId: body.client_id ?? "dynamic-mcp-client",
    userId: String(body.user_id),
    connectionId: body.connection_id,
    expiresAt: body.exp,
    permissions,
  };
}

export function createRemoteApiClientFactory(
  access: RemoteAccess,
  config: RemoteMcpConfig,
  request: typeof fetch = fetch,
  onTokenExchange?: (
    outcome: "success" | "failure",
    durationMs: number,
  ) => void,
): () => Promise<OpenLogApiClient> {
  let clientPromise: Promise<OpenLogApiClient> | undefined;
  return () => {
    const startedAt = performance.now();
    clientPromise ??= exchangeForInternalApiToken(access.token, config, request)
      .then(
        (accessToken) => {
          onTokenExchange?.("success", performance.now() - startedAt);
          return new OpenLogApiClient({
            accessToken,
            apiBaseUrl: config.apiBaseUrl,
            authenticationMode: "bearer",
            request,
          });
        },
      )
      .catch((error) => {
        onTokenExchange?.("failure", performance.now() - startedAt);
        throw error;
      });
    return clientPromise;
  };
}

async function exchangeForInternalApiToken(
  subjectToken: string,
  config: RemoteMcpConfig,
  request: typeof fetch,
): Promise<string> {
  const response = await request(config.tokenUrl, {
    method: "POST",
    headers: {
      authorization: basicAuthentication(config),
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      subject_token: subjectToken,
      subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
      requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
      resource: config.internalApiResource,
      audience: config.internalApiResource,
      scope: "mcp:internal",
    }),
  }).catch(() => {
    throw new RemoteAuthError(
      "Internal API token exchange failed.",
      "token_exchange",
    );
  });
  if (!response.ok) {
    throw new RemoteAuthError(
      "Internal API token exchange failed.",
      "token_exchange",
    );
  }
  const body = (await response.json()) as TokenExchangeResponse;
  if (
    !body.access_token ||
    body.token_type?.toLowerCase() !== "bearer" ||
    !Number.isFinite(body.expires_in) ||
    Number(body.expires_in) > 60
  ) {
    throw new RemoteAuthError(
      "Internal API token response is invalid.",
      "token_exchange",
    );
  }
  return body.access_token;
}

function permissionsFor(
  profile: McpPermissionProfile,
  advertisedCapabilities: string[] | undefined,
): ResolvedMcpPermissions {
  const capabilities =
    profile === "read-only"
      ? (["read"] as const)
      : profile === "safe-write"
        ? (["read", "write", "publish"] as const)
        : (["read", "write", "publish", "delete"] as const);
  if (
    advertisedCapabilities &&
    (advertisedCapabilities.length !== capabilities.length ||
      capabilities.some(
        (capability) => !advertisedCapabilities.includes(capability),
      ))
  ) {
    throw new RemoteAuthError(
      "The MCP permission profile is inconsistent.",
      "invalid_token",
    );
  }
  return {
    profile,
    capabilities: [...capabilities],
    configured: true,
    updatedAt: null,
  };
}

function hasAudience(
  audience: string | string[] | undefined,
  expected: string,
) {
  return Array.isArray(audience)
    ? audience.includes(expected)
    : audience === expected;
}

function basicAuthentication(config: RemoteMcpConfig): string {
  return `Basic ${Buffer.from(
    `${config.serviceClientId}:${config.serviceClientSecret}`,
    "utf8",
  ).toString("base64")}`;
}

function required(value: string | undefined, name: string): string {
  if (!value?.trim()) {
    throw new Error(`${name} must be configured.`);
  }
  return value.trim();
}

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("MCP_PORT must be a valid TCP port.");
  }
  return port;
}
