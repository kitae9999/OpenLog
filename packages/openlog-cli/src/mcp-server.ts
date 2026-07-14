import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ApiError, OpenLogApiClient } from "./api-client.js";
import { readAuthFile, type AuthFile } from "./auth-store.js";
import { createAuthenticatedApiClient } from "./authenticated-client.js";
import { getApiBaseUrl, getWebBaseUrl } from "./config.js";
import {
  readMcpPermissions,
  type ResolvedMcpPermissions,
} from "./mcp-permissions.js";
import {
  createContentPreview,
  McpToolRegistry,
  READ_TOOL_ANNOTATIONS,
  WRITE_TOOL_ANNOTATIONS,
} from "./mcp-toolkit.js";
import { registerWorkspaceTools } from "./mcp-workspace-tools.js";
import { uploadPostImage } from "./post-image-upload.js";
import { createProjectGit, type ProjectGit } from "./project-git.js";

export const OPENLOG_MCP_INSTRUCTIONS = `Before substantive work on a project, call start_openlog_session with that project's path.
Use the returned workspace Agent Guide and Capture Mode when deciding whether to create or update OpenLog Tasks, Logs, and Outputs.
AUTO allows proactive draft creation or updates when the Guide says the work is worth recording. ASK requires user confirmation before those writes. EXPLICIT permits those writes only after an explicit user request.
Do not guess a workspace or connect an uninitialized project. If start_openlog_session returns not_initialized or stale, show its init command to the user.
Publishing and deletion keep their own confirmation requirements regardless of Capture Mode. The active MCP permission profile always takes precedence.`;

type CreateOpenLogMcpServerOptions = {
  permissions?: ResolvedMcpPermissions;
  createAuthenticatedClient?: () => Promise<OpenLogApiClient>;
  readAuth?: () => Promise<AuthFile | null>;
  uploadImage?: typeof uploadPostImage;
  apiBaseUrl?: string;
  webBaseUrl?: string;
  projectGit?: ProjectGit;
};

export type CreatedOpenLogMcpServer = {
  server: McpServer;
  permissions: ResolvedMcpPermissions;
  toolNames: string[];
};

export async function createOpenLogMcpServer(
  options: CreateOpenLogMcpServerOptions = {},
): Promise<CreatedOpenLogMcpServer> {
  // 의존성을 주입할 수 있는 factory로 구성해 실제 네트워크 없이 도구 목록과 호출을 테스트한다.
  const permissions = options.permissions ?? (await readMcpPermissions());
  const createClient =
    options.createAuthenticatedClient ?? createAuthenticatedApiClient;
  const readAuth = options.readAuth ?? readAuthFile;
  const uploadImage = options.uploadImage ?? uploadPostImage;
  const apiBaseUrl = options.apiBaseUrl ?? getApiBaseUrl();
  const webBaseUrl = options.webBaseUrl ?? getWebBaseUrl();
  const projectGit = options.projectGit ?? createProjectGit();
  const server = new McpServer(
    {
      name: "openlog",
      version: "1.0.0",
    },
    { instructions: OPENLOG_MCP_INSTRUCTIONS },
  );
  const registry = new McpToolRegistry(server, permissions, createClient);

  registry.registerLocal(
    "get_mcp_permissions",
    "read",
    {
      title: "Get OpenLog MCP Permissions",
      description:
        "Return the active local MCP permission profile and capabilities.",
      inputSchema: {},
      annotations: READ_TOOL_ANNOTATIONS,
    },
    async () => ({
      ...permissions,
      note:
        "This is a local agent safety policy, not a server-side authorization boundary.",
    }),
  );

  registry.registerLocal(
    "get_auth_status",
    "read",
    {
      title: "Get OpenLog Auth Status",
      description: "Check whether the local OpenLog CLI is authenticated.",
      inputSchema: {},
      annotations: READ_TOOL_ANNOTATIONS,
    },
    async () => {
      let resolvedApiBaseUrl = apiBaseUrl;
      try {
        const authFile = await readAuth();
        if (!authFile) {
          return {
            authenticated: false,
            apiBaseUrl: resolvedApiBaseUrl,
          };
        }
        resolvedApiBaseUrl = authFile.apiBaseUrl;
        const me = await createClient().then((client) => client.get("/auth/me"));

        return {
          authenticated: true,
          apiBaseUrl: authFile.apiBaseUrl,
          user: me,
        };
      } catch (error) {
        return {
          authenticated: false,
          apiBaseUrl: resolvedApiBaseUrl,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  registry.registerAuthenticated(
    "get_me",
    "read",
    {
      title: "Get OpenLog Me",
      description: "Return the currently authenticated OpenLog user.",
      inputSchema: {},
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client) => client.get("/auth/me"),
  );

  registry.registerAuthenticated(
    "start_openlog_session",
    "read",
    {
      title: "Start OpenLog Project Session",
      description:
        "Resolve an explicitly supplied Git project path through its local openlog.projectId and return the latest workspace Agent Guide and Capture Mode. Call this before substantive project work. It never guesses or creates a workspace binding.",
      inputSchema: {
        projectPath: z.string().min(1),
      },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    async (client, { projectPath }) => {
      let project;
      try {
        project = await projectGit.inspect(projectPath);
      } catch (error) {
        return sessionInitRequired(
          projectPath,
          "not_git_repository",
          error instanceof Error ? error.message : String(error),
        );
      }

      if (project.projectId == null) {
        return sessionInitRequired(project.root, "not_initialized");
      }

      try {
        const context = await client.get(
          `/workspace-projects/${project.projectId}/agent-context`,
        );
        return {
          status: "ready",
          projectRoot: project.root,
          ...asRecord(context),
        };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return sessionInitRequired(
            project.root,
            "stale",
            `OpenLog project ID ${project.projectId} no longer resolves.`,
          );
        }
        throw error;
      }
    },
  );

  registry.registerAuthenticated(
    "list_my_notifications",
    "read",
    {
      title: "List My OpenLog Notifications",
      description: "Return notifications for the authenticated OpenLog user.",
      inputSchema: {
        size: z.number().int().min(1).max(20).default(20),
      },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { size }) =>
      client.get(
        `/notifications?${new URLSearchParams({ size: String(size) })}`,
      ),
  );

  registry.registerAuthenticated(
    "list_my_liked_posts",
    "read",
    {
      title: "List My Liked OpenLog Posts",
      description: "Return posts liked by the authenticated OpenLog user.",
      inputSchema: {
        cursor: z.string().optional(),
        size: z.number().int().min(1).max(20).default(10),
      },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { cursor, size }) => {
      const params = new URLSearchParams({ size: String(size) });
      if (cursor) {
        params.set("cursor", cursor);
      }
      return client.get(`/users/me/liked-posts?${params}`);
    },
  );

  registry.registerAuthenticated(
    "list_my_posts",
    "read",
    {
      title: "List My OpenLog Posts",
      description: "Return posts authored by the authenticated OpenLog user.",
      inputSchema: {
        size: z.number().int().min(1).max(100).default(20),
      },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    async (client, { size }) => {
      const me = await client.get<{ username?: string | null }>("/auth/me");
      const username = me.username?.trim();

      if (!username) {
        throw new Error("Complete OpenLog onboarding before listing your posts.");
      }

      const posts = await client.get<unknown[]>(
        `/users/${encodeURIComponent(username)}/posts`,
      );

      return {
        username,
        total: posts.length,
        size,
        hasMore: posts.length > size,
        posts: posts.slice(0, size),
      };
    },
  );

  registry.registerAuthenticated(
    "upload_post_image",
    "write",
    {
      title: "Upload OpenLog Post Image",
      description:
        "Convert a local image file to WebP, upload it to OpenLog, and return markdown for post content.",
      inputSchema: {
        filePath: z.string().min(1),
        altText: z.string().optional(),
      },
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    (client, { filePath, altText }) =>
      uploadImage(client, {
        filePath,
        altText,
      }),
  );

  registry.registerAuthenticated(
    "publish_post",
    "publish",
    {
      title: "Publish OpenLog Post",
      description:
        "Publish a new post. Requires confirm: true unless skipConfirmation: true is explicitly provided.",
      inputSchema: {
        title: z.string().min(1),
        description: z.string().min(1),
        content: z.string().min(1),
        topics: z.array(z.string()).default([]),
        links: z
          .array(
            z.object({
              label: z.string().min(1),
              targetSlug: z.string().min(1),
            }),
          )
          .default([]),
        confirm: z.boolean().optional(),
        skipConfirmation: z.boolean().optional(),
      },
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    async (
      client,
      {
        title,
        description,
        content,
        topics,
        links,
        confirm,
        skipConfirmation,
      },
    ) => {
      const post = normalizePostInput({
        title,
        description,
        content,
        topics,
        links,
      });

      // 명시적 확인 전에는 POST를 실행하지 않고 실제 발행 입력의 미리보기만 반환한다.
      if (confirm !== true && skipConfirmation !== true) {
        return {
          requiresConfirmation: true,
          preview: {
            title: post.title,
            description: post.description,
            contentPreview: createContentPreview(post.content),
            contentLength: post.content.length,
            topics: post.topics,
            links: post.links,
          },
          nextStep:
            "Call publish_post again with confirm: true, or skipConfirmation: true if the user explicitly requested publishing without confirmation.",
        };
      }

      const published = await client.post<PostWriteResponse>("/posts", post);
      const postPath = buildPublicPostPath(
        published.authorUsername,
        published.slug,
      );

      return {
        ...published,
        path: postPath,
        url: new URL(postPath, `${webBaseUrl}/`).toString(),
      };
    },
  );

  registry.registerAuthenticated(
    "get_post_detail",
    "read",
    {
      title: "Get OpenLog Post Detail",
      description:
        "Return a public OpenLog post detail by author username and post slug.",
      inputSchema: {
        username: z.string().min(1),
        slug: z.string().min(1),
      },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { username, slug }) =>
      client.get(
        `/users/${encodeURIComponent(username)}/posts/${encodeURIComponent(slug)}`,
      ),
  );

  // 워크스페이스 도구는 별도 catalog에서 등록해 서버 시작 안내와 테스트 목록을 일치시킨다.
  registerWorkspaceTools(registry, webBaseUrl);

  return {
    server,
    permissions,
    toolNames: [...registry.toolNames],
  };
}

export async function runMcpServer(): Promise<void> {
  const created = await createOpenLogMcpServer();
  printMcpStartupHint(created.permissions, created.toolNames);
  await created.server.connect(new StdioServerTransport());
}

function sessionInitRequired(
  projectPath: string,
  status: "not_git_repository" | "not_initialized" | "stale",
  detail?: string,
) {
  return {
    status,
    projectPath,
    ...(detail ? { detail } : {}),
    initCommand: `cd ${quoteShellArgument(projectPath)} && npx @openloghq/cli@latest init`,
  };
}

function quoteShellArgument(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : { context: value };
}

type PostWriteResponse = {
  authorUsername: string;
  slug: string;
};

type PostLinkInput = {
  label: string;
  targetSlug: string;
};

type PostWriteInput = {
  title: string;
  description: string;
  content: string;
  topics: string[];
  links: PostLinkInput[];
};

function normalizePostInput(input: PostWriteInput): PostWriteInput {
  const title = input.title.trim();
  const description = input.description.trim();
  const content = input.content.trim();

  if (!title) {
    throw new Error("title is required.");
  }
  if (!description) {
    throw new Error("description is required.");
  }
  if (!content) {
    throw new Error("content is required.");
  }

  return {
    title,
    description,
    content,
    topics: normalizeTopics(input.topics),
    links: normalizeLinks(input.links),
  };
}

function normalizeTopics(topics: string[]): string[] {
  const normalized = topics
    .map((topic) => topic.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(normalized)];
}

function normalizeLinks(links: PostLinkInput[]): PostLinkInput[] {
  const normalized: PostLinkInput[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    const label = link.label.trim();
    const targetSlug = link.targetSlug.trim();
    const key = `${label}\u0000${targetSlug}`;

    if (!label || !targetSlug || seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push({ label, targetSlug });
  }

  return normalized;
}

function buildPublicPostPath(username: string, slug: string): string {
  return `/@${encodeURIComponent(username)}/posts/${encodeURIComponent(slug)}`;
}

function printMcpStartupHint(
  permissions: ResolvedMcpPermissions,
  toolNames: string[],
): void {
  if (!process.stderr.isTTY) {
    return;
  }

  console.error(`OpenLog MCP server is running over stdio.

Profile: ${permissions.profile}
Capabilities: ${permissions.capabilities.join(", ")}

This terminal is now reserved for MCP protocol traffic.
Press Ctrl+C to stop it.

Available tools:
${toolNames.map((name) => `  ${name}`).join("\n")}
`);
}
