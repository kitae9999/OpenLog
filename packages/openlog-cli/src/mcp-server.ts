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

export const OPENLOG_MCP_INSTRUCTIONS = `본격적인 작업을 시작하기 전에 start_openlog_session을 호출해요.
로컬 작업 폴더를 알고 있다면 projectPath를 넘겨요. 경로를 모를 때는 인자 없이 호출하면 돼요.
경로 없이 호출했을 때 selection_required가 돌아오면 프로젝트 목록을 보여주고 어떤 프로젝트를 사용할지 물어봐요. 여러 프로젝트 중 하나를 임의로 고르면 안 돼요.
no_projects가 돌아오면 create_workspace_project를 제안해요. 이 도구는 로컬 폴더 없이 OpenLog 프로젝트를 만들어요. 필요하면 나중에 openlog init으로 폴더를 연결할 수 있어요.
세션에서 받은 Workspace Agent Guide와 Capture Mode를 살펴보고 OpenLog Task, Log, Output 초안을 만들거나 수정할지 정해요.
AUTO에서는 Guide가 기록할 만한 작업이라고 안내할 때 초안을 먼저 만들거나 수정해도 돼요. ASK에서는 쓰기 전에 사용자에게 물어봐요. EXPLICIT에서는 사용자가 직접 요청했을 때만 써요.
앞으로도 계속 적용할 행동 규칙이나 기록 정책에 사용자가 동의했다면, 먼저 변경 내용을 보여주고 확인받은 뒤 update_workspace_agent_guide로 Agent Guide를 수정해요. 한 번만 필요한 정보는 Agent Guide가 아니라 NOTE Log에 남겨요.
사용자가 Capture Mode를 바꾸고 싶어 하면, 먼저 변경 내용을 보여주고 확인받은 뒤 update_workspace_project_capture_mode를 호출해요. 새 설정을 적용하려면 프로젝트를 다시 읽거나 세션을 다시 시작해요.
워크스페이스나 프로젝트를 짐작해서 고르지 마세요. projectPath로 호출한 start_openlog_session이 not_initialized 또는 stale을 반환하면, 함께 받은 init 명령을 사용자에게 보여줘요.
발행, Agent Guide 수정, Capture Mode 변경, 삭제에는 Capture Mode와 관계없이 각 도구의 확인 규칙이 적용돼요. 현재 MCP 권한 설정이 언제나 우선해요.`;

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
