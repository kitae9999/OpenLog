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
import {
  createProjectBinding,
  type ProjectBinding,
} from "./project-binding.js";

export const OPENLOG_MCP_INSTRUCTIONS = `Before substantive work, call start_openlog_session. Supply projectPath when the agent knows the local working folder; otherwise call it without arguments.
If a pathless call returns selection_required, ask the user which listed project to use and call start_openlog_session again with that projectId. Never choose among multiple projects without the user.
If it returns no_projects, offer create_workspace_project. That tool creates an OpenLog project without requiring a local directory; a folder can be bound later with openlog init.
Use the returned workspace Agent Guide and Capture Mode when deciding whether to create or update OpenLog Tasks, Logs, and Outputs.
AUTO allows proactive draft creation or updates when the Guide says the work is worth recording. ASK requires user confirmation before those writes. EXPLICIT permits those writes only after an explicit user request.
When the user agrees to lasting behavior or recording policy changes during a session, update the Agent Guide with update_workspace_agent_guide after preview confirmation; keep one-off knowledge in NOTE Logs instead.
When the user wants to change Capture Mode during a session, use update_workspace_project_capture_mode after preview confirmation, then re-read the project or restart the session so the new mode applies.
Do not guess a workspace or project. If a path-based start_openlog_session returns not_initialized or stale, show its init command to the user.
Publishing, Agent Guide updates, Capture Mode updates, and deletion keep their own confirmation requirements regardless of Capture Mode. The active MCP permission profile always takes precedence.`;

type CreateOpenLogMcpServerOptions = {
  permissions?: ResolvedMcpPermissions;
  createAuthenticatedClient?: () => Promise<OpenLogApiClient>;
  readAuth?: () => Promise<AuthFile | null>;
  uploadImage?: typeof uploadPostImage;
  apiBaseUrl?: string;
  webBaseUrl?: string;
  projectBinding?: ProjectBinding;
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
  const projectBinding = options.projectBinding ?? createProjectBinding();
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
        "Return the latest workspace Agent Guide and Capture Mode. Supply projectPath to resolve a Git or general-folder local binding, projectId to select a project returned by an earlier pathless call, or neither to discover projects. A pathless call auto-starts only when exactly one project exists; with multiple projects it returns selection_required so the agent can ask the user.",
      inputSchema: {
        projectPath: z.string().trim().min(1).optional(),
        projectId: z.number().int().positive().optional(),
      },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    async (client, { projectPath, projectId }) => {
      if (projectPath && projectId) {
        throw new Error("Provide projectPath or projectId, not both.");
      }

      if (projectPath) {
        const project = await projectBinding.inspect(projectPath);
        if (project.projectId == null) {
          return sessionInitRequired(project.root, "not_initialized");
        }
        return loadSessionContext(client, project.projectId, project.root);
      }

      if (projectId) {
        return loadSessionContext(client, projectId);
      }

      const workspaces = await client.get<SessionWorkspace[]>("/workspaces");
      const projects = workspaces.flatMap((workspace) =>
        workspace.projects.map((project) => ({
          projectId: project.id,
          displayName: project.displayName,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          captureMode: project.captureMode,
          repositoryFullName: project.repositoryFullName,
        })),
      );

      if (projects.length === 0) {
        const canCreateProject = permissions.capabilities.includes("write");
        return {
          status: "no_projects",
          workspaces: workspaces.map((workspace) => ({
            workspaceId: workspace.id,
            workspaceName: workspace.name,
          })),
          nextStep:
            workspaces.length === 0
              ? `Create a workspace in OpenLog first: ${webBaseUrl}/workspaces/new`
              : canCreateProject
                ? "Ask the user which workspace should own the project, then call create_workspace_project with its workspaceId and a displayName."
                : "Project creation requires the write capability. Ask the user to create one in OpenLog or enable safe-write/full with openlog mcp permissions set, then restart the MCP server.",
        };
      }

      if (projects.length === 1) {
        return loadSessionContext(client, projects[0]!.projectId);
      }

      return {
        status: "selection_required",
        projects,
        nextStep:
          "Ask the user which project to use, then call start_openlog_session with that project's projectId.",
      };
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
  status: "not_initialized" | "stale",
  detail?: string,
) {
  return {
    status,
    projectPath,
    ...(detail ? { detail } : {}),
    initCommand: `cd ${quoteShellArgument(projectPath)} && npx @openloghq/cli@latest init`,
  };
}

async function loadSessionContext(
  client: OpenLogApiClient,
  projectId: number,
  projectRoot?: string,
) {
  try {
    const context = await client.get(
      `/workspace-projects/${projectId}/agent-context`,
    );
    return {
      status: "ready",
      ...(projectRoot ? { projectRoot } : {}),
      ...asRecord(context),
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      if (projectRoot) {
        return sessionInitRequired(
          projectRoot,
          "stale",
          `OpenLog project ID ${projectId} no longer resolves.`,
        );
      }
      return {
        status: "stale",
        projectId,
        detail: `OpenLog project ID ${projectId} no longer resolves.`,
        nextStep:
          "Call start_openlog_session without arguments to refresh the project list.",
      };
    }
    throw error;
  }
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

type SessionWorkspace = {
  id: number;
  name: string;
  projects: Array<{
    id: number;
    displayName: string;
    repositoryFullName: string | null;
    captureMode: "AUTO" | "ASK" | "EXPLICIT";
  }>;
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
