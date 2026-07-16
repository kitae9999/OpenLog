import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ApiError, type OpenLogApiClient } from "../src/api-client.js";
import { createOpenLogMcpServer } from "../src/mcp-server.js";
import type {
  McpPermissionProfile,
  ResolvedMcpPermissions,
} from "../src/mcp-permissions.js";
import type { ProjectBinding } from "../src/project-binding.js";

type RecordedCall = {
  method: string;
  path: string;
  body?: unknown;
};

test("exposes tools according to the active permission profile", async (t) => {
  const readOnly = await createSession(t, "read-only");
  const readOnlyTools = await readOnly.client.listTools();
  assert.ok(readOnlyTools.tools.some((tool) => tool.name === "list_workspaces"));
  assert.ok(readOnlyTools.tools.some((tool) => tool.name === "start_openlog_session"));
  assert.ok(readOnlyTools.tools.some((tool) => tool.name === "get_workspace_agent_guide"));
  assert.ok(readOnlyTools.tools.some((tool) => tool.name === "get_workspace_project"));
  assert.ok(!readOnlyTools.tools.some((tool) => tool.name === "create_workspace_task"));
  assert.ok(!readOnlyTools.tools.some((tool) => tool.name === "update_workspace_agent_guide"));
  assert.ok(!readOnlyTools.tools.some((tool) => tool.name === "create_workspace_project"));
  assert.ok(!readOnlyTools.tools.some((tool) => tool.name === "update_workspace_project_capture_mode"));
  assert.ok(!readOnlyTools.tools.some((tool) => tool.name === "publish_post"));
  assert.ok(!readOnlyTools.tools.some((tool) => tool.name === "delete_workspace_task"));

  const safeWrite = await createSession(t, "safe-write");
  const safeWriteTools = await safeWrite.client.listTools();
  assert.ok(safeWriteTools.tools.some((tool) => tool.name === "create_workspace_task"));
  assert.ok(safeWriteTools.tools.some((tool) => tool.name === "update_workspace_agent_guide"));
  assert.ok(safeWriteTools.tools.some((tool) => tool.name === "create_workspace_project"));
  assert.ok(safeWriteTools.tools.some((tool) => tool.name === "update_workspace_project_capture_mode"));
  assert.ok(safeWriteTools.tools.some((tool) => tool.name === "publish_workspace_output"));
  assert.ok(!safeWriteTools.tools.some((tool) => tool.name === "delete_workspace_task"));

  const full = await createSession(t, "full");
  const fullTools = await full.client.listTools();
  const deleteTask = fullTools.tools.find(
    (tool) => tool.name === "delete_workspace_task",
  );
  assert.equal(deleteTask?.annotations?.destructiveHint, true);
  assert.ok(fullTools.tools.some((tool) => tool.name === "clear_working_brief"));
});

test("advertises session instructions and document selection criteria", async (t) => {
  const session = await createSession(t, "safe-write");
  assert.match(session.client.getInstructions() ?? "", /작업을 시작하기 전에 start_openlog_session/);
  assert.match(session.client.getInstructions() ?? "", /임의로 고르면 안 돼요/);
  assert.match(session.client.getInstructions() ?? "", /selection_required/);
  assert.match(session.client.getInstructions() ?? "", /create_workspace_project/);
  assert.match(session.client.getInstructions() ?? "", /update_workspace_agent_guide/);
  assert.match(session.client.getInstructions() ?? "", /update_workspace_project_capture_mode/);
  assert.match(session.client.getInstructions() ?? "", /발행, Agent Guide 수정, Capture Mode 변경, 삭제/);

  const tools = await session.client.listTools();
  const task = tools.tools.find((tool) => tool.name === "create_workspace_task");
  const log = tools.tools.find((tool) => tool.name === "create_workspace_log");
  const output = tools.tools.find((tool) => tool.name === "create_workspace_output");
  const updateGuide = tools.tools.find(
    (tool) => tool.name === "update_workspace_agent_guide",
  );
  const updateCapture = tools.tools.find(
    (tool) => tool.name === "update_workspace_project_capture_mode",
  );
  assert.match(task?.description ?? "", /actionable work/);
  assert.match(log?.description ?? "", /durable event or reusable knowledge/);
  assert.match(output?.description ?? "", /reviewable or shareable draft/);
  assert.match(updateGuide?.description ?? "", /durable behavior and recording policy/);
  assert.match(updateCapture?.description ?? "", /Capture Mode/);
});

test("starts a read-only project session from the supplied project path", async (t) => {
  const session = await createSession(t, "read-only", {
    projectBinding: projectBindingFixture(42),
  });

  const context = await callJson(session.client, "start_openlog_session", {
    projectPath: "/work/openlog",
  });

  assert.equal(context.status, "ready");
  assert.equal(context.projectRoot, "/work/openlog");
  assert.deepEqual(session.api.calls, [
    { method: "GET", path: "/workspace-projects/42/agent-context" },
  ]);
  const guide = context.guide as Record<string, unknown>;
  assert.equal(guide.revision, 3);
});

test("does not guess a workspace for uninitialized or stale projects", async (t) => {
  const uninitialized = await createSession(t, "read-only", {
    projectBinding: projectBindingFixture(null),
  });
  const missing = await callJson(uninitialized.client, "start_openlog_session", {
    projectPath: "/work/openlog",
  });
  assert.equal(missing.status, "not_initialized");
  assert.match(String(missing.initCommand), /npx @openloghq\/cli@latest init/);
  assert.deepEqual(uninitialized.api.calls, []);

  const stale = await createSession(t, "read-only", {
    projectBinding: projectBindingFixture(99),
  });
  stale.api.failures.set(
    "/workspace-projects/99/agent-context",
    new ApiError(404, "test", "missing"),
  );
  const staleResult = await callJson(stale.client, "start_openlog_session", {
    projectPath: "/work/openlog",
  });
  assert.equal(staleResult.status, "stale");
  assert.match(String(staleResult.initCommand), /openloghq\/cli@latest init/);
});

test("discovers pathless projects without guessing among multiple choices", async (t) => {
  const session = await createSession(t, "read-only");

  const noProjects = await callJson(
    session.client,
    "start_openlog_session",
    {},
  );
  assert.equal(noProjects.status, "no_projects");
  assert.deepEqual(session.api.calls, [{ method: "GET", path: "/workspaces" }]);

  session.api.calls.length = 0;
  session.api.workspaces = [workspaceResponse([workspaceProjectResponse("ASK")])];
  const onlyProject = await callJson(
    session.client,
    "start_openlog_session",
    {},
  );
  assert.equal(onlyProject.status, "ready");
  assert.deepEqual(session.api.calls, [
    { method: "GET", path: "/workspaces" },
    { method: "GET", path: "/workspace-projects/42/agent-context" },
  ]);

  session.api.calls.length = 0;
  session.api.workspaces = [
    workspaceResponse([
      workspaceProjectResponse("ASK"),
      workspaceProjectResponse("AUTO", { id: 43, displayName: "Notes" }),
    ]),
  ];
  const selection = await callJson(
    session.client,
    "start_openlog_session",
    {},
  );
  assert.equal(selection.status, "selection_required");
  assert.deepEqual(
    (selection.projects as Array<Record<string, unknown>>).map(
      (project) => project.projectId,
    ),
    [42, 43],
  );
  assert.deepEqual(session.api.calls, [{ method: "GET", path: "/workspaces" }]);
});

test("starts a pathless session from an explicitly selected project ID", async (t) => {
  const session = await createSession(t, "read-only");

  const context = await callJson(session.client, "start_openlog_session", {
    projectId: 42,
  });
  assert.equal(context.status, "ready");
  assert.equal("projectRoot" in context, false);
  assert.deepEqual(session.api.calls, [
    { method: "GET", path: "/workspace-projects/42/agent-context" },
  ]);

  session.api.calls.length = 0;
  const invalid = await session.client.callTool({
    name: "start_openlog_session",
    arguments: { projectPath: "/work/openlog", projectId: 42 },
  });
  assert.equal(invalid.isError, true);
  assert.match(readText(invalid), /not both/);
  assert.deepEqual(session.api.calls, []);
});

test("maps workspace read and safe-write tools to their REST endpoints", async (t) => {
  const session = await createSession(t, "safe-write");
  const cases: Array<{
    tool: string;
    args: Record<string, unknown>;
    calls: RecordedCall[];
  }> = [
    { tool: "list_workspaces", args: {}, calls: [{ method: "GET", path: "/workspaces" }] },
    { tool: "get_workspace", args: { workspaceId: 1 }, calls: [{ method: "GET", path: "/workspaces/1" }] },
    {
      tool: "get_workspace_agent_guide",
      args: { workspaceId: 1 },
      calls: [{ method: "GET", path: "/workspaces/1/agent-guide" }],
    },
    {
      tool: "get_workspace_project",
      args: { projectId: 42 },
      calls: [{ method: "GET", path: "/workspace-projects/42" }],
    },
    { tool: "get_working_brief", args: { workspaceId: 1 }, calls: [{ method: "GET", path: "/workspaces/1/working-brief" }] },
    {
      tool: "push_working_brief",
      args: { workspaceId: 1, title: "Now", prose: "Working", taskId: 2, branch: "feature/mcp" },
      calls: [{ method: "PUT", path: "/workspaces/1/working-brief", body: { title: "Now", prose: "Working", taskId: 2, branch: "feature/mcp" } }],
    },
    {
      tool: "get_workspace_activity",
      args: { workspaceId: 1, from: "2026-07-01", to: "2026-07-13" },
      calls: [{ method: "GET", path: "/workspaces/1/activity?from=2026-07-01&to=2026-07-13" }],
    },
    {
      tool: "get_workspace_activity_day_logs",
      args: { workspaceId: 1, date: "2026-07-13" },
      calls: [{ method: "GET", path: "/workspaces/1/activity/2026-07-13/logs" }],
    },
    {
      tool: "list_workspace_tasks",
      args: { workspaceId: 1, status: "DOING", cursor: "next", size: 10 },
      calls: [{ method: "GET", path: "/workspaces/1/tasks?status=DOING&cursor=next&size=10" }],
    },
    { tool: "get_workspace_task", args: { workspaceId: 1, taskId: 2 }, calls: [{ method: "GET", path: "/workspaces/1/tasks/2" }] },
    {
      tool: "create_workspace_task",
      args: { workspaceId: 1, title: "Task", description: "Desc", content: "Body", status: "TODO" },
      calls: [{ method: "POST", path: "/workspaces/1/tasks", body: { title: "Task", description: "Desc", content: "Body", status: "TODO" } }],
    },
    {
      tool: "update_workspace_task",
      args: { workspaceId: 1, taskId: 2, title: "Task", description: null, content: "Body", status: "DONE" },
      calls: [{ method: "PUT", path: "/workspaces/1/tasks/2", body: { title: "Task", description: null, content: "Body", status: "DONE" } }],
    },
    {
      tool: "list_workspace_logs",
      args: { workspaceId: 1, taskId: 2, cursor: "next", size: 20 },
      calls: [{ method: "GET", path: "/workspaces/1/logs?taskId=2&cursor=next&size=20" }],
    },
    { tool: "get_workspace_log", args: { workspaceId: 1, logId: 3 }, calls: [{ method: "GET", path: "/workspaces/1/logs/3" }] },
    {
      tool: "create_workspace_log",
      args: { workspaceId: 1, kind: "ISSUE", title: "Issue", content: "Body", summary: null, taskId: 2, status: "OPEN" },
      calls: [{ method: "POST", path: "/workspaces/1/logs", body: { kind: "ISSUE", title: "Issue", content: "Body", summary: null, taskId: 2, status: "OPEN" } }],
    },
    {
      tool: "update_workspace_log",
      args: { workspaceId: 1, logId: 3, title: "Fixed", content: "Body", summary: "Summary", taskId: null, status: "CLOSED" },
      calls: [{ method: "PUT", path: "/workspaces/1/logs/3", body: { title: "Fixed", content: "Body", summary: "Summary", taskId: null, status: "CLOSED" } }],
    },
    {
      tool: "list_workspace_todos",
      args: { workspaceId: 1, from: "2026-07-01", to: "2026-07-13" },
      calls: [{ method: "GET", path: "/workspaces/1/todos?from=2026-07-01&to=2026-07-13" }],
    },
    {
      tool: "list_workspace_todos",
      args: { workspaceId: 1 },
      calls: [{ method: "GET", path: "/workspaces/1/todos" }],
    },
    {
      tool: "create_workspace_todo",
      args: { workspaceId: 1, title: "Review", plannedFor: "2026-07-13", taskId: 2 },
      calls: [{ method: "POST", path: "/workspaces/1/todos", body: { title: "Review", plannedFor: "2026-07-13", taskId: 2 } }],
    },
    {
      tool: "set_workspace_todo_done",
      args: { workspaceId: 1, todoId: 4, done: true },
      calls: [{ method: "PATCH", path: "/workspaces/1/todos/4", body: { done: true } }],
    },
    {
      tool: "list_workspace_memories",
      args: { workspaceId: 1, cursor: "next", size: 50 },
      calls: [{ method: "GET", path: "/workspaces/1/memories?cursor=next&size=50" }],
    },
    { tool: "get_workspace_memory", args: { workspaceId: 1, memoryId: 5 }, calls: [{ method: "GET", path: "/workspaces/1/memories/5" }] },
    {
      tool: "create_workspace_memory",
      args: { workspaceId: 1, title: "Rule", content: "Remember", taskId: 2 },
      calls: [{ method: "POST", path: "/workspaces/1/memories", body: { title: "Rule", content: "Remember", taskId: 2 } }],
    },
    {
      tool: "create_workspace_memory_from_log",
      args: { workspaceId: 1, logId: 3 },
      calls: [{ method: "POST", path: "/workspaces/1/logs/3/memory" }],
    },
    {
      tool: "update_workspace_memory",
      args: { workspaceId: 1, memoryId: 5, title: "Rule", content: "Updated", taskId: null },
      calls: [{ method: "PUT", path: "/workspaces/1/memories/5", body: { title: "Rule", content: "Updated", taskId: null } }],
    },
    {
      tool: "list_workspace_outputs",
      args: { workspaceId: 1, status: "DRAFT" },
      calls: [{ method: "GET", path: "/workspaces/1/outputs?status=DRAFT" }],
    },
    { tool: "get_workspace_output", args: { workspaceId: 1, outputId: 6 }, calls: [{ method: "GET", path: "/workspaces/1/outputs/6" }] },
    {
      tool: "create_workspace_output",
      args: { workspaceId: 1, title: "Output", content: "Draft", taskIds: [2], logIds: [3] },
      calls: [{ method: "POST", path: "/workspaces/1/outputs", body: { title: "Output", content: "Draft", taskIds: [2], logIds: [3] } }],
    },
    {
      tool: "update_workspace_output",
      args: { workspaceId: 1, outputId: 6, title: "Output", content: "Updated", taskIds: [2], logIds: [3] },
      calls: [{ method: "PUT", path: "/workspaces/1/outputs/6", body: { title: "Output", content: "Updated", taskIds: [2], logIds: [3] } }],
    },
    {
      tool: "list_workspace_links",
      args: { workspaceId: 1 },
      calls: [
        { method: "GET", path: "/workspaces/1/task-links" },
        { method: "GET", path: "/workspaces/1/log-links" },
        { method: "GET", path: "/workspaces/1/cross-links" },
      ],
    },
    {
      tool: "create_workspace_task_link",
      args: { workspaceId: 1, fromTaskId: 2, toTaskId: 7, relation: "BLOCKS" },
      calls: [{ method: "POST", path: "/workspaces/1/task-links", body: { fromTaskId: 2, toTaskId: 7, relation: "BLOCKS" } }],
    },
    {
      tool: "create_workspace_log_link",
      args: { workspaceId: 1, fromLogId: 3, toLogId: 8, relation: "FIXES" },
      calls: [{ method: "POST_NO_CONTENT", path: "/workspaces/1/log-links", body: { fromLogId: 3, toLogId: 8, relation: "FIXES" } }],
    },
    {
      tool: "create_workspace_cross_link",
      args: { workspaceId: 1, fromType: "TASK", fromNodeId: 2, toType: "MEMORY", toNodeId: 5, relation: "SUPPORTS" },
      calls: [{ method: "POST", path: "/workspaces/1/cross-links", body: { fromType: "TASK", fromNodeId: 2, toType: "MEMORY", toNodeId: 5, relation: "SUPPORTS" } }],
    },
  ];

  for (const entry of cases) {
    session.api.calls.length = 0;
    const result = await session.client.callTool({ name: entry.tool, arguments: entry.args });
    assert.notEqual(result.isError, true, entry.tool);
    assert.deepEqual(session.api.calls, entry.calls, entry.tool);
  }
});

test("previews workspace output publishing before the confirmed POST", async (t) => {
  const session = await createSession(t, "safe-write");

  const preview = await callJson(session.client, "publish_workspace_output", {
    workspaceId: 1,
    outputId: 6,
    description: "Release notes",
    topics: [" Kotlin ", "kotlin"],
  });
  assert.equal(preview.requiresConfirmation, true);
  assert.deepEqual(session.api.calls, [{ method: "GET", path: "/workspaces/1/outputs/6" }]);

  session.api.calls.length = 0;
  const published = await callJson(session.client, "publish_workspace_output", {
    workspaceId: 1,
    outputId: 6,
    description: "Release notes",
    topics: [" Kotlin ", "kotlin"],
    confirm: true,
  });
  assert.equal(published.url, "https://openlog.test/@owner/posts/output-post");
  assert.deepEqual(session.api.calls, [
    {
      method: "POST",
      path: "/workspaces/1/outputs/6/publish",
      body: { description: "Release notes", topics: ["kotlin"] },
    },
  ]);
});

test("previews agent guide updates before the confirmed PUT", async (t) => {
  const session = await createSession(t, "safe-write");
  const content = "# Updated Guide\n\nPrefer NOTE logs for one-off knowledge.";

  const preview = await callJson(session.client, "update_workspace_agent_guide", {
    workspaceId: 1,
    content,
  });
  assert.equal(preview.requiresConfirmation, true);
  const previewBody = preview.preview as Record<string, unknown>;
  assert.equal(previewBody.workspaceId, 1);
  assert.equal(previewBody.currentRevision, 3);
  assert.equal(previewBody.contentLength, content.length);
  assert.deepEqual(session.api.calls, [
    { method: "GET", path: "/workspaces/1/agent-guide" },
  ]);

  session.api.calls.length = 0;
  const updated = await callJson(session.client, "update_workspace_agent_guide", {
    workspaceId: 1,
    content: `  ${content}  `,
    confirm: true,
  });
  assert.equal(updated.revision, 4);
  assert.equal(updated.content, content);
  assert.deepEqual(session.api.calls, [
    {
      method: "PUT",
      path: "/workspaces/1/agent-guide",
      body: { content },
    },
  ]);
});

test("previews capture mode updates before the confirmed PATCH", async (t) => {
  const session = await createSession(t, "safe-write");

  const preview = await callJson(
    session.client,
    "update_workspace_project_capture_mode",
    { projectId: 42, captureMode: "AUTO" },
  );
  assert.equal(preview.requiresConfirmation, true);
  assert.deepEqual(preview.preview, {
    projectId: 42,
    workspaceId: 1,
    displayName: "OpenLog",
    currentCaptureMode: "ASK",
    nextCaptureMode: "AUTO",
  });
  assert.deepEqual(session.api.calls, [
    { method: "GET", path: "/workspace-projects/42" },
  ]);

  session.api.calls.length = 0;
  const updated = await callJson(
    session.client,
    "update_workspace_project_capture_mode",
    { projectId: 42, captureMode: "AUTO", confirm: true },
  );
  assert.equal(updated.captureMode, "AUTO");
  assert.deepEqual(session.api.calls, [
    { method: "GET", path: "/workspace-projects/42" },
    {
      method: "PATCH",
      path: "/workspace-projects/42",
      body: {
        workspaceId: 1,
        displayName: "OpenLog",
        repositoryFullName: "openlog/openlog",
        captureMode: "AUTO",
      },
    },
  ]);
});

test("previews directory-free project creation before creating and starting it", async (t) => {
  const session = await createSession(t, "safe-write");

  const preview = await callJson(session.client, "create_workspace_project", {
    workspaceId: 1,
    displayName: "Research notes",
    captureMode: "AUTO",
  });
  assert.equal(preview.requiresConfirmation, true);
  assert.deepEqual(preview.preview, {
    workspaceId: 1,
    displayName: "Research notes",
    captureMode: "AUTO",
  });
  assert.deepEqual(session.api.calls, []);

  const created = await callJson(session.client, "create_workspace_project", {
    workspaceId: 1,
    displayName: "Research notes",
    captureMode: "AUTO",
    confirm: true,
  });
  assert.equal(created.status, "ready");
  assert.deepEqual(session.api.calls, [
    {
      method: "POST",
      path: "/workspaces/1/projects",
      body: {
        displayName: "Research notes",
        repositoryFullName: null,
        captureMode: "AUTO",
      },
    },
    { method: "GET", path: "/workspace-projects/42/agent-context" },
  ]);
});

test("executes full-profile delete tools immediately", async (t) => {
  const session = await createSession(t, "full");
  const cases: Array<[string, Record<string, unknown>, string]> = [
    ["clear_working_brief", { workspaceId: 1 }, "/workspaces/1/working-brief"],
    ["delete_workspace_task", { workspaceId: 1, taskId: 2 }, "/workspaces/1/tasks/2"],
    ["delete_workspace_log", { workspaceId: 1, logId: 3 }, "/workspaces/1/logs/3"],
    ["delete_workspace_todo", { workspaceId: 1, todoId: 4 }, "/workspaces/1/todos/4"],
    ["delete_workspace_memory", { workspaceId: 1, memoryId: 5 }, "/workspaces/1/memories/5"],
    ["delete_workspace_output", { workspaceId: 1, outputId: 6 }, "/workspaces/1/outputs/6"],
    ["delete_workspace_task_link", { workspaceId: 1, taskLinkId: 7 }, "/workspaces/1/task-links/7"],
    ["delete_workspace_log_link", { workspaceId: 1, logLinkId: 8 }, "/workspaces/1/log-links/8"],
    ["delete_workspace_cross_link", { workspaceId: 1, crossLinkId: 9 }, "/workspaces/1/cross-links/9"],
  ];

  for (const [tool, args, path] of cases) {
    session.api.calls.length = 0;
    const result = await session.client.callTool({ name: tool, arguments: args });
    assert.notEqual(result.isError, true, tool);
    assert.deepEqual(session.api.calls, [{ method: "DELETE", path }], tool);
  }
});

test("normalizes a missing working brief and returns other API errors", async (t) => {
  const session = await createSession(t, "read-only");
  session.api.failures.set("/workspaces/1/working-brief", new ApiError(404, "test", "missing"));

  assert.deepEqual(
    await callJson(session.client, "get_working_brief", { workspaceId: 1 }),
    { workingBrief: null },
  );

  session.api.failures.set("/workspaces/1/tasks/2", new ApiError(401, "test", "expired"));
  const result = await session.client.callTool({
    name: "get_workspace_task",
    arguments: { workspaceId: 1, taskId: 2 },
  });
  assert.equal(result.isError, true);
  assert.match(readText(result), /expired/);
});

test("validates IDs, dates, ranges, and enums before calling the API", async (t) => {
  const session = await createSession(t, "safe-write");
  const invalidCalls = [
    { name: "get_workspace", arguments: { workspaceId: 0 } },
    { name: "create_workspace_task", arguments: { workspaceId: 1, title: "Task", status: "ACTIVE" } },
    { name: "list_workspace_todos", arguments: { workspaceId: 1, from: "2026-07-13" } },
    { name: "list_workspace_todos", arguments: { workspaceId: 1, plannedFor: "2026-02-30" } },
    { name: "get_workspace_activity", arguments: { workspaceId: 1, from: "2026-07-13", to: "2025-07-13" } },
  ];

  for (const request of invalidCalls) {
    session.api.calls.length = 0;
    const result = await session.client.callTool(request);
    assert.equal(result.isError, true, request.name);
    assert.deepEqual(session.api.calls, [], request.name);
  }
});

test("checks capability again when a registered tool is invoked", async (t) => {
  const permissions = permissionsFor("safe-write");
  const session = await createSession(t, permissions);
  permissions.capabilities.splice(0, permissions.capabilities.length, "read");

  const result = await session.client.callTool({
    name: "create_workspace_task",
    arguments: { workspaceId: 1, title: "Task" },
  });
  assert.equal(result.isError, true);
  assert.match(readText(result), /requires the write capability/);
  assert.deepEqual(session.api.calls, []);
});

class RecordingApiClient {
  readonly calls: RecordedCall[] = [];
  readonly failures = new Map<string, Error>();
  workspaces: ReturnType<typeof workspaceResponse>[] = [];

  async get<T>(path: string): Promise<T> {
    this.record("GET", path);
    this.throwFailure(path);
    if (path === "/workspaces") {
      return this.workspaces as T;
    }
    if (path === "/workspaces/1/outputs/6") {
      return outputResponse(null) as T;
    }
    if (path === "/workspaces/1/agent-guide") {
      return agentGuideResponse(3, "# Workspace Agent Guide") as T;
    }
    if (path === "/workspace-projects/42") {
      return workspaceProjectResponse("ASK") as T;
    }
    if (path === "/workspace-projects/42/agent-context") {
      return {
        workspace: { id: 1, name: "OpenLog", slug: "openlog" },
        project: { id: 42, workspaceId: 1, captureMode: "ASK" },
        guide: { workspaceId: 1, content: "Guide", revision: 3 },
      } as T;
    }
    return { ok: true, path } as T;
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    this.record("POST", path, body);
    this.throwFailure(path);
    if (path === "/workspaces/1/outputs/6/publish") {
      return outputResponse({ authorUsername: "owner", slug: "output-post" }) as T;
    }
    if (path === "/workspaces/1/projects") {
      const captureMode =
        body && typeof body === "object" && "captureMode" in body
          ? String((body as { captureMode: unknown }).captureMode)
          : "ASK";
      return workspaceProjectResponse(
        captureMode as "AUTO" | "ASK" | "EXPLICIT",
      ) as T;
    }
    return { ok: true, path } as T;
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    this.record("PUT", path, body);
    this.throwFailure(path);
    if (path === "/workspaces/1/agent-guide") {
      const content =
        body && typeof body === "object" && "content" in body
          ? String((body as { content: unknown }).content)
          : "";
      return agentGuideResponse(4, content) as T;
    }
    return { ok: true, path } as T;
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    this.record("PATCH", path, body);
    this.throwFailure(path);
    if (path === "/workspace-projects/42") {
      const captureMode =
        body && typeof body === "object" && "captureMode" in body
          ? String((body as { captureMode: unknown }).captureMode)
          : "ASK";
      return workspaceProjectResponse(
        captureMode as "AUTO" | "ASK" | "EXPLICIT",
      ) as T;
    }
    return { ok: true, path } as T;
  }

  async postNoContent(path: string, body?: unknown): Promise<void> {
    this.record("POST_NO_CONTENT", path, body);
    this.throwFailure(path);
  }

  async deleteNoContent(path: string): Promise<void> {
    this.record("DELETE", path);
    this.throwFailure(path);
  }

  private record(method: string, path: string, body?: unknown): void {
    this.calls.push(body === undefined ? { method, path } : { method, path, body });
  }

  private throwFailure(path: string): void {
    const failure = this.failures.get(path);
    if (failure) throw failure;
  }
}

async function createSession(
  t: test.TestContext,
  profileOrPermissions: McpPermissionProfile | ResolvedMcpPermissions,
  options: { projectBinding?: ProjectBinding } = {},
) {
  const permissions =
    typeof profileOrPermissions === "string"
      ? permissionsFor(profileOrPermissions)
      : profileOrPermissions;
  const api = new RecordingApiClient();
  const created = await createOpenLogMcpServer({
    permissions,
    createAuthenticatedClient: async () =>
      api as unknown as OpenLogApiClient,
    readAuth: async () => null,
    webBaseUrl: "https://openlog.test",
    projectBinding: options.projectBinding,
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "openlog-test", version: "1.0.0" });
  await created.server.connect(serverTransport);
  await client.connect(clientTransport);

  t.after(async () => {
    await client.close().catch(() => undefined);
    await created.server.close().catch(() => undefined);
  });

  return { api, client, server: created.server, permissions };
}

function projectBindingFixture(projectId: number | null): ProjectBinding {
  return {
    inspect: async (projectPath) => ({
      root: projectPath,
      displayName: "openlog",
      kind: "git",
      bindingPath: `${projectPath}/.git/config`,
      remoteUrl: "git@github.com:openlog/openlog.git",
      repositoryFullName: "openlog/openlog",
      projectId,
    }),
    writeProjectId: async () => {},
  };
}

function permissionsFor(profile: McpPermissionProfile): ResolvedMcpPermissions {
  const capabilities =
    profile === "read-only"
      ? (["read"] as const)
      : profile === "safe-write"
        ? (["read", "write", "publish"] as const)
        : (["read", "write", "publish", "delete"] as const);
  return {
    profile,
    capabilities: [...capabilities],
    configured: true,
    updatedAt: "2026-07-13T00:00:00.000Z",
  };
}

function outputResponse(
  publishedPost: { authorUsername: string; slug: string } | null,
) {
  return {
    id: 6,
    status: publishedPost ? "PUBLISHED" : "DRAFT",
    title: "Output",
    content: "Draft output content",
    tasks: [{ id: 2, title: "Task" }],
    logs: [{ id: 3, title: "Log" }],
    publishedPost,
  };
}

function agentGuideResponse(revision: number, content: string) {
  return {
    workspaceId: 1,
    content,
    revision,
    createdAt: "2026-07-13T00:00:00",
    updatedAt: "2026-07-14T00:00:00",
  };
}

function workspaceProjectResponse(
  captureMode: "AUTO" | "ASK" | "EXPLICIT",
  overrides: Partial<{
    id: number;
    workspaceId: number;
    displayName: string;
    repositoryFullName: string | null;
  }> = {},
) {
  return {
    id: 42,
    workspaceId: 1,
    displayName: "OpenLog",
    repositoryFullName: "openlog/openlog",
    captureMode,
    createdAt: "2026-07-13T00:00:00",
    updatedAt: "2026-07-14T00:00:00",
    ...overrides,
  };
}

function workspaceResponse(
  projects: ReturnType<typeof workspaceProjectResponse>[] = [],
) {
  return {
    id: 1,
    name: "OpenLog",
    slug: "openlog",
    projects,
    createdAt: "2026-07-13T00:00:00",
    updatedAt: "2026-07-14T00:00:00",
  };
}

async function callJson(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const result = await client.callTool({ name, arguments: args });
  assert.notEqual(result.isError, true, readText(result));
  return JSON.parse(readText(result));
}

function readText(result: { content?: unknown }): string {
  const content = result.content;
  if (!Array.isArray(content)) return "";
  const text = content.find(
    (item): item is { type: "text"; text: string } =>
      Boolean(item && typeof item === "object" && "type" in item && item.type === "text"),
  );
  return text?.text ?? "";
}
