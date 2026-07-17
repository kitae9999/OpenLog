import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  AnySchema,
  SchemaOutput,
  ShapeOutput,
  ZodRawShapeCompat,
} from "@modelcontextprotocol/sdk/server/zod-compat.js";
import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { OpenLogApiClient } from "./api-client.js";
import {
  hasMcpCapability,
  type McpCapability,
  type ResolvedMcpPermissions,
} from "./mcp-permissions.js";

export const READ_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

export const WRITE_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
};

export const IDEMPOTENT_WRITE_TOOL_ANNOTATIONS: ToolAnnotations = {
  ...WRITE_TOOL_ANNOTATIONS,
  idempotentHint: true,
};

export const DELETE_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: true,
};

type ToolInputSchema = ZodRawShapeCompat | AnySchema;

type ToolArguments<Schema extends ToolInputSchema> =
  Schema extends ZodRawShapeCompat
    ? ShapeOutput<Schema>
    : Schema extends AnySchema
      ? SchemaOutput<Schema>
      : never;

type ToolConfig<Schema extends ToolInputSchema> = {
  title?: string;
  description?: string;
  inputSchema: Schema;
  annotations?: ToolAnnotations;
};

type AuthenticatedToolHandler<Schema extends ToolInputSchema> = (
  client: OpenLogApiClient,
  args: ToolArguments<Schema>,
) => Promise<unknown>;

type LocalToolHandler<Schema extends ToolInputSchema> = (
  args: ToolArguments<Schema>,
) => Promise<unknown>;

export class McpToolRegistry {
  readonly toolNames: string[] = [];

  constructor(
    private readonly server: McpServer,
    readonly permissions: ResolvedMcpPermissions,
    private readonly createAuthenticatedClient: () => Promise<OpenLogApiClient>,
  ) {}

  registerAuthenticated<Schema extends ToolInputSchema>(
    name: string,
    capability: McpCapability,
    config: ToolConfig<Schema>,
    handler: AuthenticatedToolHandler<Schema>,
  ): void {
    // 허용되지 않은 도구는 MCP tools/list 응답에도 나타나지 않게 등록 자체를 생략한다.
    if (!hasMcpCapability(this.permissions, capability)) {
      return;
    }

    const callback = (async (args: ToolArguments<Schema>) => {
      // 목록 노출 여부와 별개로 실행 직전에도 권한을 확인해 우회 호출을 막는다.
      if (!hasMcpCapability(this.permissions, capability)) {
        return permissionDeniedResult(name, capability);
      }

      return withAuthenticatedClient(this.createAuthenticatedClient, (client) =>
        handler(client, args),
      );
    }) as ToolCallback<Schema>;

    this.server.registerTool(name, config, callback);
    this.toolNames.push(name);
  }

  registerLocal<Schema extends ToolInputSchema>(
    name: string,
    capability: McpCapability,
    config: ToolConfig<Schema>,
    handler: LocalToolHandler<Schema>,
  ): void {
    // 인증이 필요 없는 로컬 도구도 동일한 capability 정책을 적용한다.
    if (!hasMcpCapability(this.permissions, capability)) {
      return;
    }

    const callback = (async (args: ToolArguments<Schema>) => {
      if (!hasMcpCapability(this.permissions, capability)) {
        return permissionDeniedResult(name, capability);
      }

      try {
        return textResult(await handler(args));
      } catch (error) {
        return errorResult(error);
      }
    }) as ToolCallback<Schema>;

    this.server.registerTool(name, config, callback);
    this.toolNames.push(name);
  }
}

export async function withAuthenticatedClient(
  createAuthenticatedClient: () => Promise<OpenLogApiClient>,
  callback: (client: OpenLogApiClient) => Promise<unknown>,
) {
  try {
    const client = await createAuthenticatedClient();
    return textResult(await callback(client));
  } catch (error) {
    // API·인증 오류를 throw하지 않고 MCP 표준 isError 응답으로 정규화한다.
    return errorResult(error);
  }
}

export function textResult(value: unknown) {
  const serialized =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);

  return {
    content: [
      {
        type: "text" as const,
        text: serialized ?? "null",
      },
    ],
  };
}

export function createContentPreview(content: string): string {
  const preview = content.replace(/\s+/g, " ").trim();
  return preview.length > 500 ? `${preview.slice(0, 497)}...` : preview;
}

function permissionDeniedResult(name: string, capability: McpCapability) {
  return {
    content: [
      {
        type: "text" as const,
        text: `MCP tool ${name} requires the ${capability} capability. Change the profile with \`openlog mcp permissions set\` and restart the MCP server.`,
      },
    ],
    isError: true,
  };
}

function errorResult(error: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: error instanceof Error ? error.message : String(error),
      },
    ],
    isError: true,
  };
}
