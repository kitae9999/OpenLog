import {
  getLogHref,
  isActiveTaskStatus,
  isOpenIssue,
} from "@/entities/workspace/model/data";
import type {
  WorkspaceLogItem,
  WorkspaceOutputStatus,
  WorkspaceTaskOutput,
  WorkspaceTodoItem,
  WorkspaceWorkItem,
  WorkspaceWorkStatus,
} from "@/entities/workspace/model/data";
import type {
  ManagedWorkspace,
  WorkspaceActivity,
  WorkspaceCrossLinkItem,
  WorkspaceMemoryItem,
  WorkspaceUiData,
} from "@/entities/workspace/model/workspaceTypes";
import type { WorkspaceAgentSettingsData } from "@/entities/workspace/api/workspaceAgentApi";
import { clientApi, ClientApiError } from "@/shared/api/clientApi";
import { formatWorkspaceDateLabel } from "@/shared/lib/formatWorkspaceDateLabel";
import { buildPublicPostPath } from "@/shared/lib/publicRoutes";

type TaskStatus = "TODO" | "DOING" | "DONE";
type LogKind = "ISSUE" | "FIX" | "DECISION" | "NOTE";
type LogStatus = "NONE" | "OPEN" | "CLOSED";
type OutputStatus = "DRAFT" | "EXPORTED";

export type WorkspaceTaskResponse = {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceTaskCursorResponse = {
  tasks: WorkspaceTaskResponse[];
  nextCursor: string | null;
  hasNext: boolean;
};

export type WorkspaceLogResponse = {
  id: number;
  kind: LogKind;
  status: LogStatus;
  title: string;
  summary: string | null;
  taskId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceLogDetailResponse = WorkspaceLogResponse & {
  content: string;
  closedAt: string | null;
};

export type WorkspaceLogCursorResponse = {
  logs: WorkspaceLogResponse[];
  nextCursor: string | null;
  hasNext: boolean;
};

export type OutputResponse = {
  id: number;
  status: OutputStatus;
  title: string;
  taskCount: number;
  logCount: number;
  taskIds?: number[];
  logIds?: number[];
  updatedAt: string;
  exportedAt: string | null;
};

type OutputDetailResponse = {
  id: number;
  status: OutputStatus;
  title: string;
  content: string;
  tasks: Array<{ id: number; title: string; status: TaskStatus }>;
  logs: Array<{
    id: number;
    title: string;
    kind: LogKind;
    status: LogStatus;
    taskId: number | null;
  }>;
  linkedPost: {
    id: number;
    status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
    authorUsername: string;
    slug: string;
  } | null;
  updatedAt: string;
  exportedAt: string | null;
};

export type TodoResponse = {
  id: number;
  title: string;
  done: boolean;
  taskId: number | null;
  plannedFor: string;
};

export type MemoryResponse = {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  task: { id: number; title: string } | null;
  originLog: { id: number; title: string } | null;
  createdAt: string;
  updatedAt: string;
};

type WorkspacePlannerViewResponse = {
  tasks: WorkspaceTaskResponse[];
  todos: TodoResponse[];
};

type WorkspaceGraphViewResponse = {
  tasks: WorkspaceTaskResponse[];
  logs: WorkspaceLogResponse[];
  outputs: OutputResponse[];
  memories: MemoryResponse[];
  taskLinks: TaskLinkResponse[];
  logLinks: LogLinkResponse[];
  crossLinks: CrossLinkResponse[];
};

type WorkspaceActivityViewResponse = {
  activity: WorkspaceActivity;
  selectedDay: {
    date: string;
    logs: WorkspaceLogResponse[];
  };
};

type MemoryCursorResponse = {
  memories: MemoryResponse[];
  nextCursor: string | null;
  hasNext: boolean;
};

type WorkspaceAgentGuideResponse = {
  workspaceId: number;
  content: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

type TaskLinkResponse = {
  id: number;
  fromTask: WorkspaceTaskResponse;
  toTask: WorkspaceTaskResponse;
  relation: "PRECEDES" | "BLOCKS" | "RELATES_TO";
};

type LogLinkResponse = {
  id: number;
  fromLog: WorkspaceLogResponse;
  toLog: WorkspaceLogResponse;
  relation: "FIXES" | "RELATES_TO" | "SUPERSEDES";
};

type CrossLinkResponse = {
  id: number;
  fromType: Uppercase<WorkspaceCrossLinkItem["fromType"]>;
  fromNodeId: number;
  toType: Uppercase<WorkspaceCrossLinkItem["toType"]>;
  toNodeId: number;
  relation: WorkspaceCrossLinkItem["relation"];
};

type WorkingBriefResponse = {
  title: string;
  prose: string;
  taskId: number | null;
  taskTitle: string | null;
  branch: string | null;
  updatedAt: string;
};

type WorkspaceDashboardResponse = {
  tasks: WorkspaceTaskResponse[];
  logs: WorkspaceLogResponse[];
  outputs: OutputResponse[];
  todos: TodoResponse[];
  taskLinks: TaskLinkResponse[];
  logLinks: LogLinkResponse[];
  crossLinks: CrossLinkResponse[];
  memories: MemoryResponse[];
  workingBrief: WorkingBriefResponse | null;
  activity: WorkspaceActivity;
  navigationSummary?: {
    activeTaskCount: number;
    logsCount: number;
    openIssuesCount: number;
  };
};

type WorkspaceDashboardRefreshResponse = {
  zone: "TASKS" | "LOGS";
  mode: "PATCH" | "REPLACE";
  task: WorkspaceTaskResponse | null;
  tasks: WorkspaceTaskResponse[];
  log: WorkspaceLogDetailResponse | null;
  logs: WorkspaceLogResponse[];
  linkedTask: WorkspaceTaskResponse | null;
  navigationSummary: NonNullable<WorkspaceUiData["navigationSummary"]>;
  activity: WorkspaceActivity | null;
};

export async function fetchWorkspaceDashboard(workspaceId: string) {
  const { from, to } = getDashboardDateRange();
  const response = await clientApi<WorkspaceDashboardResponse>(
    `/api/workspaces/${workspaceId}/dashboard?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
  return mapDashboard(response);
}

export async function fetchWorkspaceDashboardRefresh(
  workspaceId: string,
  zone: "tasks" | "logs",
  entityIds: string[],
) {
  const { from, to } = getDashboardDateRange();
  const params = new URLSearchParams({
    zone: zone.toUpperCase(),
    from,
    to,
  });
  for (const entityId of entityIds) params.append("entityIds", entityId);
  const response = await clientApi<WorkspaceDashboardRefreshResponse>(
    `/api/workspaces/${workspaceId}/dashboard/refresh?${params.toString()}`,
  );
  return {
    zone: response.zone.toLowerCase() as "tasks" | "logs",
    mode: response.mode,
    task: response.task ? mapTask(response.task) : null,
    tasks: response.tasks.map(mapTask),
    log: response.log ? mapLog(response.log) : null,
    logs: response.logs.map(mapLog),
    linkedTask: response.linkedTask ? mapTask(response.linkedTask) : null,
    navigationSummary: response.navigationSummary,
    activity: response.activity,
  };
}

export async function fetchWorkspaceTasks(workspaceId: string) {
  const tasks: WorkspaceTaskResponse[] = [];
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams({ size: "50" });
    if (cursor) {
      params.set("cursor", cursor);
    }

    const response = await clientApi<WorkspaceTaskCursorResponse>(
      `/api/workspaces/${workspaceId}/tasks?${params.toString()}`,
    );
    tasks.push(...response.tasks);
    cursor = response.hasNext ? response.nextCursor : null;
  } while (cursor);

  return tasks.map(mapTask);
}

export async function fetchWorkspaceLogs(workspaceId: string) {
  const logs: WorkspaceLogResponse[] = [];
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams({ size: "50" });
    if (cursor) {
      params.set("cursor", cursor);
    }

    const response = await clientApi<WorkspaceLogCursorResponse>(
      `/api/workspaces/${workspaceId}/logs?${params.toString()}`,
    );
    logs.push(...response.logs);
    cursor = response.hasNext ? response.nextCursor : null;
  } while (cursor);

  return logs.map(mapLog);
}

export async function fetchWorkspaceTask(workspaceId: string, taskId: string) {
  const response = await clientApi<WorkspaceTaskResponse>(
    `/api/workspaces/${workspaceId}/tasks/${taskId}`,
  );
  return mapTask(response);
}

export async function fetchWorkspaceLog(workspaceId: string, logId: string) {
  const response = await clientApi<WorkspaceLogDetailResponse>(
    `/api/workspaces/${workspaceId}/logs/${logId}`,
  );
  return mapLog(response);
}

export async function fetchWorkspacePlanner(
  workspaceId: string,
  from: string,
  to: string,
) {
  const response = await clientApi<WorkspacePlannerViewResponse>(
    `/api/workspaces/${workspaceId}/planner-view?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
  return {
    tasks: response.tasks.map(mapTask),
    todos: response.todos.map(mapTodo),
  };
}

export async function fetchWorkspaceTodos(workspaceId: string) {
  const response = await clientApi<TodoResponse[]>(
    `/api/workspaces/${workspaceId}/todos`,
  );
  return response.map(mapTodo);
}

export async function fetchWorkspaceWorkingBrief(workspaceId: string) {
  try {
    const response = await clientApi<WorkingBriefResponse>(
      `/api/workspaces/${workspaceId}/working-brief`,
    );
    return mapWorkingBrief(response);
  } catch (error: unknown) {
    if (error instanceof ClientApiError && error.status === 404) return null;
    throw error;
  }
}

export async function fetchWorkspaceGraph(workspaceId: string) {
  const response = await clientApi<WorkspaceGraphViewResponse>(
    `/api/workspaces/${workspaceId}/graph-view`,
  );
  return mapGraph(response);
}

export async function fetchWorkspaceActivityView(
  workspaceId: string,
  from: string,
  to: string,
  date: string,
) {
  const response = await clientApi<WorkspaceActivityViewResponse>(
    `/api/workspaces/${workspaceId}/activity-view?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`,
  );
  return {
    activity: response.activity,
    logs: response.selectedDay.logs.map(mapLog),
  };
}

export async function fetchWorkspaceOutputs(workspaceId: string) {
  const response = await clientApi<OutputResponse[]>(
    `/api/workspaces/${workspaceId}/outputs`,
  );
  return response.map(mapOutput);
}

export async function fetchWorkspaceMemories(workspaceId: string) {
  const memories: MemoryResponse[] = [];
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams({ size: "50" });
    if (cursor) {
      params.set("cursor", cursor);
    }

    const response = await clientApi<MemoryCursorResponse>(
      `/api/workspaces/${workspaceId}/memories?${params.toString()}`,
    );
    memories.push(...response.memories);
    cursor = response.hasNext ? response.nextCursor : null;
  } while (cursor);

  return memories.map(mapMemory);
}

export async function fetchWorkspaceOutput(
  workspaceId: string,
  outputId: string,
) {
  const response = await clientApi<OutputDetailResponse>(
    `/api/workspaces/${workspaceId}/outputs/${outputId}`,
  );
  return mapOutput(response);
}

export async function fetchWorkspaceMemory(
  workspaceId: string,
  memoryId: string,
) {
  const response = await clientApi<MemoryResponse>(
    `/api/workspaces/${workspaceId}/memories/${memoryId}`,
  );
  return mapMemory(response);
}

export async function fetchWorkspaceAgentSettings(
  workspaces: ManagedWorkspace[],
  workspaceId: string,
): Promise<WorkspaceAgentSettingsData> {
  const guide = await clientApi<WorkspaceAgentGuideResponse>(
    `/api/workspaces/${workspaceId}/agent-guide`,
  );
  const workspace = workspaces.find((item) => item.id === workspaceId);
  if (!workspace) throw new Error("Workspace not found.");
  return {
    workspace,
    guide: {
      content: guide.content,
      revision: guide.revision,
      createdAt: guide.createdAt,
      updatedAt: guide.updatedAt,
    },
  };
}

export function buildWorkspaceUiData(
  bootstrap: {
    workspaces: ManagedWorkspace[];
    navigationSummary: WorkspaceUiData["navigationSummary"] | null;
  },
  workspaceId: string,
  partial: Partial<WorkspaceUiData>,
): WorkspaceUiData | null {
  const workspace = bootstrap.workspaces.find(
    (item) => item.id === workspaceId,
  );
  if (!workspace) return null;

  return {
    workspaceId,
    workspaceName: workspace.name,
    repositoryFullName:
      workspace.projects.length === 1
        ? workspace.projects[0].repositoryFullName
        : null,
    projects: workspace.projects,
    tasks: [],
    logs: [],
    outputs: [],
    todos: [],
    taskLinks: [],
    logLinks: [],
    crossLinks: [],
    memories: [],
    activity: null,
    navigationSummary: bootstrap.navigationSummary ?? undefined,
    workingBrief: null,
    ...partial,
  };
}

function mapDashboard(
  response: WorkspaceDashboardResponse,
): Partial<WorkspaceUiData> {
  const tasks = response.tasks.map(mapTask);
  const logs = response.logs.map(mapLog);

  return {
    tasks,
    logs,
    outputs: response.outputs.map(mapOutput),
    todos: response.todos.map(mapTodo),
    taskLinks: response.taskLinks.map((link) => ({
      id: String(link.id),
      fromTaskId: String(link.fromTask.id),
      toTaskId: String(link.toTask.id),
      relation: link.relation,
    })),
    logLinks: response.logLinks.map((link) => ({
      id: String(link.id),
      fromLogId: String(link.fromLog.id),
      toLogId: String(link.toLog.id),
      relation: link.relation,
    })),
    crossLinks: response.crossLinks.map((link) => ({
      id: String(link.id),
      fromType:
        link.fromType.toLowerCase() as WorkspaceCrossLinkItem["fromType"],
      fromNodeId: String(link.fromNodeId),
      toType: link.toType.toLowerCase() as WorkspaceCrossLinkItem["toType"],
      toNodeId: String(link.toNodeId),
      relation: link.relation,
    })),
    memories: response.memories.map(mapMemory),
    activity: response.activity,
    navigationSummary: response.navigationSummary ?? {
      activeTaskCount: tasks.filter((task) => isActiveTaskStatus(task.status))
        .length,
      logsCount: logs.length,
      openIssuesCount: logs.filter(isOpenIssue).length,
    },
    workingBrief: response.workingBrief
      ? mapWorkingBrief(response.workingBrief)
      : null,
  };
}

function mapGraph(
  response: WorkspaceGraphViewResponse,
): Partial<WorkspaceUiData> {
  return {
    tasks: response.tasks.map(mapTask),
    logs: response.logs.map(mapLog),
    outputs: response.outputs.map(mapOutput),
    memories: response.memories.map(mapMemory),
    taskLinks: response.taskLinks.map((link) => ({
      id: String(link.id),
      fromTaskId: String(link.fromTask.id),
      toTaskId: String(link.toTask.id),
      relation: link.relation,
    })),
    logLinks: response.logLinks.map((link) => ({
      id: String(link.id),
      fromLogId: String(link.fromLog.id),
      toLogId: String(link.toLog.id),
      relation: link.relation,
    })),
    crossLinks: response.crossLinks.map((link) => ({
      id: String(link.id),
      fromType:
        link.fromType.toLowerCase() as WorkspaceCrossLinkItem["fromType"],
      fromNodeId: String(link.fromNodeId),
      toType: link.toType.toLowerCase() as WorkspaceCrossLinkItem["toType"],
      toNodeId: String(link.toNodeId),
      relation: link.relation,
    })),
  };
}

export function mapTask(task: WorkspaceTaskResponse): WorkspaceWorkItem {
  return {
    id: String(task.id),
    title: task.title,
    description: task.description,
    status: mapTaskStatus(task.status),
    apiStatus: task.status,
    body: task.content ?? task.description ?? "",
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export function mapLog(
  log: WorkspaceLogResponse | WorkspaceLogDetailResponse,
): WorkspaceLogItem {
  const content = "content" in log ? log.content : undefined;
  return {
    id: String(log.id),
    tone: mapLogTone(log.kind),
    label: mapLogLabel(log.kind),
    kind: log.kind,
    status: log.status,
    title: log.title,
    description: log.summary ?? (content ? excerpt(content) : ""),
    summary: log.summary ?? undefined,
    meta: buildLogMeta(log),
    href: getLogHref(String(log.id)),
    taskId: log.taskId ? String(log.taskId) : undefined,
    body: content,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  };
}

function mapOutput(
  output: OutputResponse | OutputDetailResponse,
): WorkspaceTaskOutput {
  const isDetail = "content" in output;
  const sourceTasks = isDetail
    ? output.tasks.map((task) => ({
        id: String(task.id),
        title: task.title,
        status: mapTaskStatus(task.status),
        apiStatus: task.status,
        body: "",
      }))
    : undefined;
  const sourceLogs = isDetail
    ? output.logs.map((log) => ({
        id: String(log.id),
        tone: mapLogTone(log.kind),
        label: mapLogLabel(log.kind),
        kind: log.kind,
        status: log.status,
        title: log.title,
        description: "",
        meta:
          log.status === "NONE" ? "Linked source" : log.status.toLowerCase(),
        href: getLogHref(String(log.id)),
        taskId: log.taskId ? String(log.taskId) : undefined,
      }))
    : undefined;
  const taskIds = isDetail
    ? output.tasks.map((task) => String(task.id))
    : (output.taskIds ?? []).map(String);
  const logIds = isDetail
    ? output.logs.map((log) => String(log.id))
    : (output.logIds ?? []).map(String);
  const taskCount = isDetail ? taskIds.length : output.taskCount;
  const logCount = isDetail ? logIds.length : output.logCount;
  const status: WorkspaceOutputStatus =
    output.status === "EXPORTED" ? "exported" : "draft";
  return {
    id: String(output.id),
    taskId: taskIds[0] ?? "",
    taskIds,
    logIds,
    taskCount,
    logCount,
    sourceTasks,
    sourceLogs,
    status,
    title: output.title,
    description: `${taskCount} task${taskCount === 1 ? "" : "s"} · ${logCount} log${logCount === 1 ? "" : "s"}`,
    content: isDetail ? output.content : "",
    updatedLabel: formatWorkspaceDateLabel(output.updatedAt),
    updatedAt: output.updatedAt,
    linkedPostId:
      isDetail && output.linkedPost ? String(output.linkedPost.id) : undefined,
    linkedPostStatus:
      isDetail && output.linkedPost
        ? (output.linkedPost.status.toLowerCase() as
            | "draft"
            | "published"
            | "unpublished")
        : undefined,
    postEditHref:
      isDetail && output.linkedPost
        ? `/posts/${output.linkedPost.id}/edit`
        : undefined,
    publishedHref:
      isDetail && output.linkedPost?.status === "PUBLISHED"
        ? buildPublicPostPath(
            output.linkedPost.authorUsername,
            output.linkedPost.slug,
          )
        : undefined,
  };
}

function mapTodo(todo: TodoResponse): WorkspaceTodoItem {
  return {
    id: String(todo.id),
    title: todo.title,
    done: todo.done,
    taskId: todo.taskId ? String(todo.taskId) : undefined,
    plannedFor: todo.plannedFor,
  };
}

function mapWorkingBrief(brief: WorkingBriefResponse) {
  return {
    title: brief.title,
    prose: brief.prose,
    taskId: brief.taskId === null ? undefined : String(brief.taskId),
    taskTitle: brief.taskTitle ?? undefined,
    branch: brief.branch ?? undefined,
    updatedLabel: formatWorkspaceDateLabel(brief.updatedAt),
  };
}

function mapMemory(memory: MemoryResponse): WorkspaceMemoryItem {
  return {
    id: String(memory.id),
    title: memory.title,
    content: memory.content,
    excerpt: memory.excerpt,
    task: memory.task
      ? { id: String(memory.task.id), title: memory.task.title }
      : null,
    originLog: memory.originLog
      ? { id: String(memory.originLog.id), title: memory.originLog.title }
      : null,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  };
}

function mapTaskStatus(status: TaskStatus): WorkspaceWorkStatus {
  if (status === "DONE") return "done";
  if (status === "DOING") return "doing";
  return "todo";
}

function mapLogLabel(kind: LogKind) {
  if (kind === "ISSUE") return "Issue";
  if (kind === "FIX") return "Fix";
  if (kind === "DECISION") return "Decision";
  return "Note";
}

function mapLogTone(kind: LogKind): WorkspaceLogItem["tone"] {
  if (kind === "ISSUE") return "amber";
  if (kind === "FIX") return "green";
  if (kind === "DECISION") return "blue";
  return "zinc";
}

function buildLogMeta(log: WorkspaceLogResponse | WorkspaceLogDetailResponse) {
  const activityAt = log.updatedAt || log.createdAt;
  if (log.status === "OPEN") {
    return `open · ${formatWorkspaceDateLabel(activityAt)}`;
  }
  if (log.status === "CLOSED") {
    const closedAt = "closedAt" in log ? log.closedAt : null;
    return `closed · ${formatWorkspaceDateLabel(closedAt ?? activityAt)}`;
  }
  return formatWorkspaceDateLabel(activityAt);
}

function excerpt(content: string, maxLength = 120) {
  const plain = content
    .replace(/^#+\s+/gm, "")
    .replace(/[*`_~[\]()]/g, "")
    .trim();
  if (!plain) return "";
  return plain.length <= maxLength
    ? plain
    : `${plain.slice(0, maxLength).trim()}...`;
}

function getDashboardDateRange() {
  const to = getSeoulIsoDate(new Date());
  const from = getSeoulIsoDate(
    new Date(new Date(`${to}T00:00:00Z`).getTime() - 364 * 86_400_000),
  );
  return { from, to };
}

function getSeoulIsoDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
