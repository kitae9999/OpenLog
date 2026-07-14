import { z } from "zod";
import { ApiError } from "./api-client.js";
import type { McpToolRegistry } from "./mcp-toolkit.js";
import {
  createContentPreview,
  DELETE_TOOL_ANNOTATIONS,
  IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
  READ_TOOL_ANNOTATIONS,
  WRITE_TOOL_ANNOTATIONS,
} from "./mcp-toolkit.js";

const POSITIVE_ID = z.number().int().positive();
// MCP 입력 단계에서 백엔드 계약과 동일한 날짜·enum 값만 허용한다.
const ISO_DATE = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date in YYYY-MM-DD format.")
  .refine(isValidIsoDate, "Expected a valid calendar date.");
const TASK_STATUS = z.enum(["TODO", "DOING", "DONE"]);
const LOG_KIND = z.enum(["ISSUE", "FIX", "DECISION", "NOTE"]);
const LOG_STATUS = z.enum(["NONE", "OPEN", "CLOSED"]);
const OUTPUT_STATUS = z.enum(["DRAFT", "EXPORTED", "PUBLISHED"]);
const TASK_LINK_RELATION = z.enum(["PRECEDES", "BLOCKS", "RELATES_TO"]);
const LOG_LINK_RELATION = z.enum(["FIXES", "RELATES_TO", "SUPERSEDES"]);
const WORKSPACE_NODE_TYPE = z.enum(["TASK", "LOG", "OUTPUT", "MEMORY"]);
const CROSS_LINK_RELATION = z.enum([
  "RELATES_TO",
  "REFERENCES",
  "SUPPORTS",
  "DERIVED_FROM",
]);

const TODO_LIST_INPUT = z
  .object({
    workspaceId: POSITIVE_ID,
    plannedFor: ISO_DATE.optional(),
    from: ISO_DATE.optional(),
    to: ISO_DATE.optional(),
  })
  .superRefine((value, context) => {
    // Todo 조회는 단일 날짜 또는 완전한 기간 중 한 방식만 받는다.
    const usesSingleDate = value.plannedFor && !value.from && !value.to;
    const usesRange = !value.plannedFor && value.from && value.to;
    if (!usesSingleDate && !usesRange) {
      context.addIssue({
        code: "custom",
        message: "Provide plannedFor, or provide both from and to.",
      });
      return;
    }
    if (value.from && value.to) {
      validateDateRange(value.from, value.to, context);
    }
  });

const ACTIVITY_RANGE_INPUT = z
  .object({
    workspaceId: POSITIVE_ID,
    from: ISO_DATE,
    to: ISO_DATE,
  })
  .superRefine((value, context) => {
    validateDateRange(value.from, value.to, context);
  });

const CAPTURE_MODE = z.enum(["AUTO", "ASK", "EXPLICIT"]);

type OutputDetailResponse = {
  id: number;
  status: string;
  title: string;
  content: string;
  tasks: Array<{ id: number; title: string }>;
  logs: Array<{ id: number; title: string }>;
  publishedPost?: {
    authorUsername: string;
    slug: string;
  } | null;
};

type AgentGuideResponse = {
  workspaceId: number;
  content: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

type WorkspaceProjectResponse = {
  id: number;
  workspaceId: number;
  displayName: string;
  repositoryFullName: string | null;
  captureMode: "AUTO" | "ASK" | "EXPLICIT";
  createdAt: string;
  updatedAt: string;
};

export function registerWorkspaceTools(
  registry: McpToolRegistry,
  webBaseUrl: string,
): void {
  registerWorkspaceReadTools(registry);
  registerAgentGuideTools(registry);
  registerCaptureModeTools(registry);
  registerTaskTools(registry);
  registerLogTools(registry);
  registerTodoTools(registry);
  registerMemoryTools(registry);
  registerOutputTools(registry, webBaseUrl);
  registerLinkTools(registry);
  registerWorkspaceDeleteTools(registry);
}

function registerAgentGuideTools(registry: McpToolRegistry): void {
  registry.registerAuthenticated(
    "get_workspace_agent_guide",
    "read",
    {
      title: "Get OpenLog Workspace Agent Guide",
      description:
        "Return the current workspace Agent Guide content and revision. Prefer this mid-session when the Guide may have changed, or before updating it. Use Guide content for durable agent behavior and recording policy; keep one-off knowledge in NOTE Logs.",
      inputSchema: { workspaceId: POSITIVE_ID },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId }) =>
      client.get(`/workspaces/${workspaceId}/agent-guide`),
  );

  registry.registerAuthenticated(
    "update_workspace_agent_guide",
    "write",
    {
      title: "Update OpenLog Workspace Agent Guide",
      description:
        "Replace the workspace Agent Guide with full Markdown content. Use only for durable behavior and recording policy agreed in the session; keep one-off knowledge in NOTE Logs. Preserve useful existing sections and apply minimal edits. Follow Capture Mode (ASK confirms first). Do not store secrets. Re-read with get_workspace_agent_guide when the session Guide may be stale. Requires confirm: true unless skipConfirmation is explicitly requested.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        content: z.string().min(1).max(20_000),
        confirm: z.boolean().optional(),
        skipConfirmation: z.boolean().optional(),
      },
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    async (client, { workspaceId, content, confirm, skipConfirmation }) => {
      const trimmed = content.trim();
      // 확인 전 호출은 현재 Guide 조회와 초안 preview만 반환하며 PUT은 호출하지 않는다.
      if (confirm !== true && skipConfirmation !== true) {
        const current = await client.get<AgentGuideResponse>(
          `/workspaces/${workspaceId}/agent-guide`,
        );
        return {
          requiresConfirmation: true,
          preview: {
            workspaceId,
            currentRevision: current.revision,
            contentPreview: createContentPreview(trimmed),
            contentLength: trimmed.length,
          },
          nextStep:
            "Call update_workspace_agent_guide again with confirm: true, or skipConfirmation: true if the user explicitly requested updating without confirmation.",
        };
      }

      return client.put(`/workspaces/${workspaceId}/agent-guide`, {
        content: trimmed,
      });
    },
  );
}

function registerCaptureModeTools(registry: McpToolRegistry): void {
  registry.registerAuthenticated(
    "get_workspace_project",
    "read",
    {
      title: "Get OpenLog Workspace Project",
      description:
        "Return one connected workspace project, including its Capture Mode. Prefer this mid-session when Capture Mode may have changed on the web or after an update.",
      inputSchema: { projectId: POSITIVE_ID },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { projectId }) => client.get(`/workspace-projects/${projectId}`),
  );

  registry.registerAuthenticated(
    "update_workspace_project_capture_mode",
    "write",
    {
      title: "Update OpenLog Project Capture Mode",
      description:
        "Change a project's Capture Mode (AUTO, ASK, or EXPLICIT) after user approval. AUTO allows proactive Task/Log/Output drafts when the Guide says the work matters; ASK asks first; EXPLICIT only after an explicit request. Requires confirm: true unless skipConfirmation is explicitly requested. Re-read with get_workspace_project or start_openlog_session after a confirmed change.",
      inputSchema: {
        projectId: POSITIVE_ID,
        captureMode: CAPTURE_MODE,
        confirm: z.boolean().optional(),
        skipConfirmation: z.boolean().optional(),
      },
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    async (client, { projectId, captureMode, confirm, skipConfirmation }) => {
      const current = await client.get<WorkspaceProjectResponse>(
        `/workspace-projects/${projectId}`,
      );

      // 확인 전 호출은 현재 프로젝트 조회와 변경 preview만 반환하며 PATCH는 호출하지 않는다.
      if (confirm !== true && skipConfirmation !== true) {
        return {
          requiresConfirmation: true,
          preview: {
            projectId: current.id,
            workspaceId: current.workspaceId,
            displayName: current.displayName,
            currentCaptureMode: current.captureMode,
            nextCaptureMode: captureMode,
          },
          nextStep:
            "Call update_workspace_project_capture_mode again with confirm: true, or skipConfirmation: true if the user explicitly requested updating without confirmation.",
        };
      }

      return client.patch(`/workspace-projects/${projectId}`, {
        workspaceId: current.workspaceId,
        displayName: current.displayName,
        repositoryFullName: current.repositoryFullName,
        captureMode,
      });
    },
  );
}

function registerWorkspaceReadTools(registry: McpToolRegistry): void {
  registry.registerAuthenticated(
    "list_workspaces",
    "read",
    {
      title: "List OpenLog Workspaces",
      description: "List workspaces owned by the authenticated OpenLog user.",
      inputSchema: {},
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client) => client.get("/workspaces"),
  );

  registry.registerAuthenticated(
    "get_workspace",
    "read",
    {
      title: "Get OpenLog Workspace",
      description: "Return one owned OpenLog workspace.",
      inputSchema: { workspaceId: POSITIVE_ID },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId }) => client.get(`/workspaces/${workspaceId}`),
  );

  registry.registerAuthenticated(
    "get_working_brief",
    "read",
    {
      title: "Get OpenLog Working Brief",
      description:
        "Return the workspace Now Working brief, or null when no brief exists.",
      inputSchema: { workspaceId: POSITIVE_ID },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    async (client, { workspaceId }) => {
      try {
        return {
          workingBrief: await client.get(
            `/workspaces/${workspaceId}/working-brief`,
          ),
        };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          // working brief 미생성 상태는 MCP 오류가 아니라 명시적인 null로 노출한다.
          return { workingBrief: null };
        }
        throw error;
      }
    },
  );

  registry.registerAuthenticated(
    "push_working_brief",
    "write",
    {
      title: "Push OpenLog Working Brief",
      description:
        "Overwrite the workspace Now Working brief with a short status update. Latest write wins.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        title: z.string().min(1).max(255),
        prose: z.string().min(1),
        taskId: POSITIVE_ID.nullable().default(null),
        branch: z.string().max(255).nullable().default(null),
      },
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, title, prose, taskId, branch }) =>
      client.put(`/workspaces/${workspaceId}/working-brief`, {
        title,
        prose,
        taskId,
        branch,
      }),
  );

  registry.registerAuthenticated(
    "get_workspace_activity",
    "read",
    {
      title: "Get OpenLog Workspace Activity",
      description: "Return daily log counts for an inclusive date range.",
      inputSchema: ACTIVITY_RANGE_INPUT,
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, from, to }) =>
      client.get(
        withQuery(`/workspaces/${workspaceId}/activity`, { from, to }),
      ),
  );

  registry.registerAuthenticated(
    "get_workspace_activity_day_logs",
    "read",
    {
      title: "Get OpenLog Workspace Activity Day Logs",
      description: "Return workspace logs created on one calendar date.",
      inputSchema: { workspaceId: POSITIVE_ID, date: ISO_DATE },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, date }) =>
      client.get(`/workspaces/${workspaceId}/activity/${date}/logs`),
  );
}

function registerTaskTools(registry: McpToolRegistry): void {
  registry.registerAuthenticated(
    "list_workspace_tasks",
    "read",
    {
      title: "List OpenLog Workspace Tasks",
      description: "List workspace tasks with optional status and cursor filters.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        status: TASK_STATUS.optional(),
        cursor: z.string().min(1).optional(),
        size: z.number().int().min(1).max(20).default(20),
      },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, status, cursor, size }) =>
      client.get(
        withQuery(`/workspaces/${workspaceId}/tasks`, {
          status,
          cursor,
          size,
        }),
      ),
  );

  registry.registerAuthenticated(
    "get_workspace_task",
    "read",
    {
      title: "Get OpenLog Workspace Task",
      description: "Return one workspace task in detail.",
      inputSchema: { workspaceId: POSITIVE_ID, taskId: POSITIVE_ID },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, taskId }) =>
      client.get(`/workspaces/${workspaceId}/tasks/${taskId}`),
  );

  registry.registerAuthenticated(
    "create_workspace_task",
    "write",
    {
      title: "Create OpenLog Workspace Task",
      description:
        "Create a Task only for actionable work that still needs to be started, tracked, or completed. Use it as the work container and link durable findings as Logs. Do not use a Task for an already completed event, standalone knowledge, or a shareable synthesis; prefer updating an existing Task over duplicating one. Follow the session Agent Guide and Capture Mode.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        title: z.string().min(1),
        description: z.string().nullable().default(null),
        content: z.string().nullable().default(null),
        status: TASK_STATUS.default("TODO"),
      },
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, title, description, content, status }) =>
      client.post(`/workspaces/${workspaceId}/tasks`, {
        title,
        description,
        content,
        status,
      }),
  );

  registry.registerAuthenticated(
    "update_workspace_task",
    "write",
    {
      title: "Update OpenLog Workspace Task",
      description:
        "Update an existing actionable work container and its completion state. Keep durable events and knowledge in linked Logs, and do not repurpose a Task as an Output. Prefer this over creating a duplicate. Follow the session Agent Guide and Capture Mode.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        taskId: POSITIVE_ID,
        title: z.string().min(1),
        description: z.string().nullable().default(null),
        content: z.string().nullable().default(null),
        status: TASK_STATUS,
      },
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, taskId, title, description, content, status }) =>
      client.put(`/workspaces/${workspaceId}/tasks/${taskId}`, {
        title,
        description,
        content,
        status,
      }),
  );
}

function registerLogTools(registry: McpToolRegistry): void {
  registry.registerAuthenticated(
    "list_workspace_logs",
    "read",
    {
      title: "List OpenLog Workspace Logs",
      description: "List workspace logs with optional task and cursor filters.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        taskId: POSITIVE_ID.optional(),
        cursor: z.string().min(1).optional(),
        size: z.number().int().min(1).max(20).default(20),
      },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, taskId, cursor, size }) =>
      client.get(
        withQuery(`/workspaces/${workspaceId}/logs`, {
          taskId,
          cursor,
          size,
        }),
      ),
  );

  registry.registerAuthenticated(
    "get_workspace_log",
    "read",
    {
      title: "Get OpenLog Workspace Log",
      description: "Return one workspace log in detail.",
      inputSchema: { workspaceId: POSITIVE_ID, logId: POSITIVE_ID },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, logId }) =>
      client.get(`/workspaces/${workspaceId}/logs/${logId}`),
  );

  registry.registerAuthenticated(
    "create_workspace_log",
    "write",
    {
      title: "Create OpenLog Workspace Log",
      description:
        "Create a Log for a durable event or reusable knowledge: ISSUE for a relevant problem, FIX for an identified cause and resolution, DECISION for a meaningful choice and rationale, or NOTE for reusable context. ISSUE uses OPEN/CLOSED; other kinds use NONE. Link the producing Task when applicable. Do not use Logs as future-work containers, raw transcripts, or routine command history. Prefer updating or linking existing records over duplicates, and follow the session Agent Guide and Capture Mode.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        kind: LOG_KIND,
        title: z.string().min(1),
        content: z.string().min(1),
        summary: z.string().nullable().default(null),
        taskId: POSITIVE_ID.nullable().default(null),
        status: LOG_STATUS.nullable().default(null),
      },
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, kind, title, content, summary, taskId, status }) =>
      client.post(`/workspaces/${workspaceId}/logs`, {
        kind,
        title,
        content,
        summary,
        taskId,
        status,
      }),
  );

  registry.registerAuthenticated(
    "update_workspace_log",
    "write",
    {
      title: "Update OpenLog Workspace Log",
      description:
        "Update an existing durable event or knowledge record while preserving its original kind. Keep future work in Tasks and shareable syntheses in Outputs. Prefer this over creating a duplicate, and follow the session Agent Guide and Capture Mode.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        logId: POSITIVE_ID,
        title: z.string().min(1),
        content: z.string().min(1),
        summary: z.string().nullable().default(null),
        taskId: POSITIVE_ID.nullable().default(null),
        status: LOG_STATUS.nullable().default(null),
      },
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, logId, title, content, summary, taskId, status }) =>
      client.put(`/workspaces/${workspaceId}/logs/${logId}`, {
        title,
        content,
        summary,
        taskId,
        status,
      }),
  );
}

function registerTodoTools(registry: McpToolRegistry): void {
  registry.registerAuthenticated(
    "list_workspace_todos",
    "read",
    {
      title: "List OpenLog Workspace Todos",
      description:
        "List todos for one date or an inclusive date range of at most 366 days.",
      inputSchema: TODO_LIST_INPUT,
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, plannedFor, from, to }) =>
      client.get(
        withQuery(`/workspaces/${workspaceId}/todos`, {
          plannedFor,
          from,
          to,
        }),
      ),
  );

  registry.registerAuthenticated(
    "create_workspace_todo",
    "write",
    {
      title: "Create OpenLog Workspace Todo",
      description: "Create a dated todo, optionally linked to a task.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        title: z.string().min(1),
        plannedFor: ISO_DATE,
        taskId: POSITIVE_ID.nullable().default(null),
      },
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, title, plannedFor, taskId }) =>
      client.post(`/workspaces/${workspaceId}/todos`, {
        title,
        plannedFor,
        taskId,
      }),
  );

  registry.registerAuthenticated(
    "set_workspace_todo_done",
    "write",
    {
      title: "Set OpenLog Workspace Todo Done",
      description: "Mark a workspace todo done or reopen it.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        todoId: POSITIVE_ID,
        done: z.boolean(),
      },
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, todoId, done }) =>
      client.patch(`/workspaces/${workspaceId}/todos/${todoId}`, { done }),
  );
}

function registerMemoryTools(registry: McpToolRegistry): void {
  registry.registerAuthenticated(
    "list_workspace_memories",
    "read",
    {
      title: "List OpenLog Workspace Memories",
      description: "List reusable workspace memories with cursor pagination.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        cursor: z.string().min(1).optional(),
        size: z.number().int().min(1).max(50).default(20),
      },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, cursor, size }) =>
      client.get(
        withQuery(`/workspaces/${workspaceId}/memories`, { cursor, size }),
      ),
  );

  registry.registerAuthenticated(
    "get_workspace_memory",
    "read",
    {
      title: "Get OpenLog Workspace Memory",
      description: "Return one workspace memory.",
      inputSchema: { workspaceId: POSITIVE_ID, memoryId: POSITIVE_ID },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, memoryId }) =>
      client.get(`/workspaces/${workspaceId}/memories/${memoryId}`),
  );

  registry.registerAuthenticated(
    "create_workspace_memory",
    "write",
    {
      title: "Create OpenLog Workspace Memory",
      description: "Create reusable workspace context, optionally linked to a task.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        title: z.string().min(1),
        content: z.string().min(1),
        taskId: POSITIVE_ID.nullable().default(null),
      },
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, title, content, taskId }) =>
      client.post(`/workspaces/${workspaceId}/memories`, {
        title,
        content,
        taskId,
      }),
  );

  registry.registerAuthenticated(
    "create_workspace_memory_from_log",
    "write",
    {
      title: "Create OpenLog Workspace Memory From Log",
      description:
        "Create a memory from a log, or return the existing memory for that log.",
      inputSchema: { workspaceId: POSITIVE_ID, logId: POSITIVE_ID },
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, logId }) =>
      client.post(`/workspaces/${workspaceId}/logs/${logId}/memory`),
  );

  registry.registerAuthenticated(
    "update_workspace_memory",
    "write",
    {
      title: "Update OpenLog Workspace Memory",
      description: "Replace the editable fields of a workspace memory.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        memoryId: POSITIVE_ID,
        title: z.string().min(1),
        content: z.string().min(1),
        taskId: POSITIVE_ID.nullable().default(null),
      },
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, memoryId, title, content, taskId }) =>
      client.put(`/workspaces/${workspaceId}/memories/${memoryId}`, {
        title,
        content,
        taskId,
      }),
  );
}

function registerOutputTools(
  registry: McpToolRegistry,
  webBaseUrl: string,
): void {
  registry.registerAuthenticated(
    "list_workspace_outputs",
    "read",
    {
      title: "List OpenLog Workspace Outputs",
      description: "List workspace outputs with an optional status filter.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        status: OUTPUT_STATUS.optional(),
      },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, status }) =>
      client.get(
        withQuery(`/workspaces/${workspaceId}/outputs`, { status }),
      ),
  );

  registry.registerAuthenticated(
    "get_workspace_output",
    "read",
    {
      title: "Get OpenLog Workspace Output",
      description: "Return one output with its source tasks and logs.",
      inputSchema: { workspaceId: POSITIVE_ID, outputId: POSITIVE_ID },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, outputId }) =>
      client.get(`/workspaces/${workspaceId}/outputs/${outputId}`),
  );

  registry.registerAuthenticated(
    "create_workspace_output",
    "write",
    {
      title: "Create OpenLog Workspace Output",
      description:
        "Create an Output only for a coherent, reviewable or shareable draft that synthesizes selected Tasks and Logs. Do not use an Output for a single follow-up action, routine progress note, raw conversation, or isolated incident. Prefer updating an existing Output over duplicating one, and follow the session Agent Guide and Capture Mode.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        title: z.string().min(1),
        content: z.string().min(1),
        taskIds: z.array(POSITIVE_ID).default([]),
        logIds: z.array(POSITIVE_ID).default([]),
      },
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, title, content, taskIds, logIds }) =>
      client.post(`/workspaces/${workspaceId}/outputs`, {
        title,
        content,
        taskIds,
        logIds,
      }),
  );

  registry.registerAuthenticated(
    "update_workspace_output",
    "write",
    {
      title: "Update OpenLog Workspace Output",
      description:
        "Update an existing coherent draft and its source Tasks and Logs. Keep actionable work in Tasks and durable events or knowledge in Logs. Prefer this over creating a duplicate Output, and follow the session Agent Guide and Capture Mode.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        outputId: POSITIVE_ID,
        title: z.string().min(1),
        content: z.string().min(1),
        taskIds: z.array(POSITIVE_ID).default([]),
        logIds: z.array(POSITIVE_ID).default([]),
      },
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, outputId, title, content, taskIds, logIds }) =>
      client.put(`/workspaces/${workspaceId}/outputs/${outputId}`, {
        title,
        content,
        taskIds,
        logIds,
      }),
  );

  registry.registerAuthenticated(
    "publish_workspace_output",
    "publish",
    {
      title: "Publish OpenLog Workspace Output",
      description:
        "Preview and publish a draft output. Requires confirm: true unless skipConfirmation is explicitly requested.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        outputId: POSITIVE_ID,
        description: z.string().min(1),
        topics: z.array(z.string()).default([]),
        confirm: z.boolean().optional(),
        skipConfirmation: z.boolean().optional(),
      },
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    async (
      client,
      {
        workspaceId,
        outputId,
        description,
        topics,
        confirm,
        skipConfirmation,
      },
    ) => {
      // 확인 전 호출은 output 조회만 수행하며 발행 endpoint는 호출하지 않는다.
      if (confirm !== true && skipConfirmation !== true) {
        const output = await client.get<OutputDetailResponse>(
          `/workspaces/${workspaceId}/outputs/${outputId}`,
        );
        return {
          requiresConfirmation: true,
          preview: {
            id: output.id,
            status: output.status,
            title: output.title,
            contentPreview: createContentPreview(output.content),
            contentLength: output.content.length,
            taskIds: output.tasks.map((task) => task.id),
            logIds: output.logs.map((log) => log.id),
            description: description.trim(),
            topics: normalizeTopics(topics),
          },
          nextStep:
            "Call publish_workspace_output again with confirm: true, or skipConfirmation: true if the user explicitly requested publishing without confirmation.",
        };
      }

      const published = await client.post<OutputDetailResponse>(
        `/workspaces/${workspaceId}/outputs/${outputId}/publish`,
        {
          description: description.trim(),
          topics: normalizeTopics(topics),
        },
      );
      const post = published.publishedPost;
      if (!post) {
        return published;
      }

      const path = buildPublicPostPath(post.authorUsername, post.slug);
      return {
        ...published,
        path,
        url: new URL(path, `${webBaseUrl}/`).toString(),
      };
    },
  );
}

function registerLinkTools(registry: McpToolRegistry): void {
  registry.registerAuthenticated(
    "list_workspace_links",
    "read",
    {
      title: "List OpenLog Workspace Links",
      description: "Return task, log, and cross-type links for a workspace.",
      inputSchema: { workspaceId: POSITIVE_ID },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    async (client, { workspaceId }) => {
      // 서로 다른 세 링크 API를 병렬 조회해 하나의 workspace graph 응답으로 묶는다.
      const [taskLinks, logLinks, crossLinks] = await Promise.all([
        client.get(`/workspaces/${workspaceId}/task-links`),
        client.get(`/workspaces/${workspaceId}/log-links`),
        client.get(`/workspaces/${workspaceId}/cross-links`),
      ]);
      return { taskLinks, logLinks, crossLinks };
    },
  );

  registry.registerAuthenticated(
    "create_workspace_task_link",
    "write",
    {
      title: "Create OpenLog Workspace Task Link",
      description: "Connect two different tasks in one workspace.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        fromTaskId: POSITIVE_ID,
        toTaskId: POSITIVE_ID,
        relation: TASK_LINK_RELATION,
      },
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    (client, { workspaceId, fromTaskId, toTaskId, relation }) =>
      client.post(`/workspaces/${workspaceId}/task-links`, {
        fromTaskId,
        toTaskId,
        relation,
      }),
  );

  registry.registerAuthenticated(
    "create_workspace_log_link",
    "write",
    {
      title: "Create OpenLog Workspace Log Link",
      description: "Connect two different logs in one workspace.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        fromLogId: POSITIVE_ID,
        toLogId: POSITIVE_ID,
        relation: LOG_LINK_RELATION,
      },
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    async (client, { workspaceId, fromLogId, toLogId, relation }) => {
      await client.postNoContent(`/workspaces/${workspaceId}/log-links`, {
        fromLogId,
        toLogId,
        relation,
      });
      return { created: true, fromLogId, toLogId, relation };
    },
  );

  registry.registerAuthenticated(
    "create_workspace_cross_link",
    "write",
    {
      title: "Create OpenLog Workspace Cross Link",
      description: "Connect two workspace nodes of different document types.",
      inputSchema: {
        workspaceId: POSITIVE_ID,
        fromType: WORKSPACE_NODE_TYPE,
        fromNodeId: POSITIVE_ID,
        toType: WORKSPACE_NODE_TYPE,
        toNodeId: POSITIVE_ID,
        relation: CROSS_LINK_RELATION,
      },
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    (
      client,
      { workspaceId, fromType, fromNodeId, toType, toNodeId, relation },
    ) =>
      client.post(`/workspaces/${workspaceId}/cross-links`, {
        fromType,
        fromNodeId,
        toType,
        toNodeId,
        relation,
      }),
  );
}

function registerWorkspaceDeleteTools(registry: McpToolRegistry): void {
  // delete capability는 full 프로필에만 있으므로 아래 도구는 다른 프로필에서 등록되지 않는다.
  registerDeleteTool(registry, "clear_working_brief", {
    title: "Clear OpenLog Working Brief",
    description: "Immediately clear the workspace Now Working brief.",
    inputSchema: { workspaceId: POSITIVE_ID },
    path: ({ workspaceId }) => `/workspaces/${workspaceId}/working-brief`,
    result: ({ workspaceId }) => ({ cleared: true, workspaceId }),
  });

  registerDeleteTool(registry, "delete_workspace_task", {
    title: "Delete OpenLog Workspace Task",
    description: "Immediately delete one workspace task.",
    inputSchema: { workspaceId: POSITIVE_ID, taskId: POSITIVE_ID },
    path: ({ workspaceId, taskId }) =>
      `/workspaces/${workspaceId}/tasks/${taskId}`,
    result: ({ workspaceId, taskId }) => ({ deleted: true, workspaceId, taskId }),
  });

  registerDeleteTool(registry, "delete_workspace_log", {
    title: "Delete OpenLog Workspace Log",
    description: "Immediately delete one workspace log.",
    inputSchema: { workspaceId: POSITIVE_ID, logId: POSITIVE_ID },
    path: ({ workspaceId, logId }) =>
      `/workspaces/${workspaceId}/logs/${logId}`,
    result: ({ workspaceId, logId }) => ({ deleted: true, workspaceId, logId }),
  });

  registerDeleteTool(registry, "delete_workspace_todo", {
    title: "Delete OpenLog Workspace Todo",
    description: "Immediately delete one workspace todo.",
    inputSchema: { workspaceId: POSITIVE_ID, todoId: POSITIVE_ID },
    path: ({ workspaceId, todoId }) =>
      `/workspaces/${workspaceId}/todos/${todoId}`,
    result: ({ workspaceId, todoId }) => ({ deleted: true, workspaceId, todoId }),
  });

  registerDeleteTool(registry, "delete_workspace_memory", {
    title: "Delete OpenLog Workspace Memory",
    description: "Immediately delete one workspace memory.",
    inputSchema: { workspaceId: POSITIVE_ID, memoryId: POSITIVE_ID },
    path: ({ workspaceId, memoryId }) =>
      `/workspaces/${workspaceId}/memories/${memoryId}`,
    result: ({ workspaceId, memoryId }) => ({
      deleted: true,
      workspaceId,
      memoryId,
    }),
  });

  registerDeleteTool(registry, "delete_workspace_output", {
    title: "Delete OpenLog Workspace Output",
    description: "Immediately delete one workspace output.",
    inputSchema: { workspaceId: POSITIVE_ID, outputId: POSITIVE_ID },
    path: ({ workspaceId, outputId }) =>
      `/workspaces/${workspaceId}/outputs/${outputId}`,
    result: ({ workspaceId, outputId }) => ({
      deleted: true,
      workspaceId,
      outputId,
    }),
  });

  registerDeleteTool(registry, "delete_workspace_task_link", {
    title: "Delete OpenLog Workspace Task Link",
    description: "Immediately delete one workspace task link.",
    inputSchema: { workspaceId: POSITIVE_ID, taskLinkId: POSITIVE_ID },
    path: ({ workspaceId, taskLinkId }) =>
      `/workspaces/${workspaceId}/task-links/${taskLinkId}`,
    result: ({ workspaceId, taskLinkId }) => ({
      deleted: true,
      workspaceId,
      taskLinkId,
    }),
  });

  registerDeleteTool(registry, "delete_workspace_log_link", {
    title: "Delete OpenLog Workspace Log Link",
    description: "Immediately delete one workspace log link.",
    inputSchema: { workspaceId: POSITIVE_ID, logLinkId: POSITIVE_ID },
    path: ({ workspaceId, logLinkId }) =>
      `/workspaces/${workspaceId}/log-links/${logLinkId}`,
    result: ({ workspaceId, logLinkId }) => ({
      deleted: true,
      workspaceId,
      logLinkId,
    }),
  });

  registerDeleteTool(registry, "delete_workspace_cross_link", {
    title: "Delete OpenLog Workspace Cross Link",
    description: "Immediately delete one workspace cross-type link.",
    inputSchema: { workspaceId: POSITIVE_ID, crossLinkId: POSITIVE_ID },
    path: ({ workspaceId, crossLinkId }) =>
      `/workspaces/${workspaceId}/cross-links/${crossLinkId}`,
    result: ({ workspaceId, crossLinkId }) => ({
      deleted: true,
      workspaceId,
      crossLinkId,
    }),
  });
}

function registerDeleteTool<Schema extends Record<string, z.ZodType>>(
  registry: McpToolRegistry,
  name: string,
  config: {
    title: string;
    description: string;
    inputSchema: Schema;
    path: (args: z.infer<z.ZodObject<Schema>>) => string;
    result: (args: z.infer<z.ZodObject<Schema>>) => unknown;
  },
): void {
  // 삭제 도구의 권한·annotation·204 응답 처리를 한곳에서 동일하게 적용한다.
  registry.registerAuthenticated(
    name,
    "delete",
    {
      title: config.title,
      description: config.description,
      inputSchema: config.inputSchema,
      annotations: DELETE_TOOL_ANNOTATIONS,
    },
    async (client, args) => {
      const typedArgs = args as z.infer<z.ZodObject<Schema>>;
      await client.deleteNoContent(config.path(typedArgs));
      return config.result(typedArgs);
    },
  );
}

function withQuery(
  path: string,
  values: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(values)) {
    // optional 값은 query에 문자열 "undefined"로 전달하지 않는다.
    if (value !== undefined) {
      params.set(name, String(value));
    }
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function normalizeTopics(topics: string[]): string[] {
  return [
    ...new Set(
      topics
        .map((topic) => topic.trim().toLowerCase())
        .filter((topic) => topic.length > 0),
    ),
  ];
}

function buildPublicPostPath(username: string, slug: string): string {
  return `/@${encodeURIComponent(username)}/posts/${encodeURIComponent(slug)}`;
}

function isValidIsoDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateDateRange(
  from: string,
  to: string,
  context: z.RefinementCtx,
): void {
  const fromTime = Date.parse(`${from}T00:00:00.000Z`);
  const toTime = Date.parse(`${to}T00:00:00.000Z`);
  if (toTime < fromTime) {
    context.addIssue({ code: "custom", message: "to must not be before from." });
    return;
  }
  const inclusiveDays = (toTime - fromTime) / 86_400_000 + 1;
  if (inclusiveDays > 366) {
    context.addIssue({
      code: "custom",
      message: "The date range must not exceed 366 days.",
    });
  }
}
