import { getLogHref } from "@/entities/workspace/model/data";
import type {
  WorkspaceLogItem,
  WorkspaceOutputStatus,
  WorkspaceTaskOutput,
  WorkspaceTodoItem,
  WorkspaceWorkItem,
  WorkspaceWorkStatus,
} from "@/entities/workspace/model/data";
import type {
  WorkspaceActivity,
  WorkspaceCrossLinkItem,
  WorkspaceMemoryItem,
  WorkspaceUiData,
} from "@/entities/workspace/model/workspaceTypes";
import type { AppBootstrap } from "@/features/app-session/model/appBootstrap";
import { clientApi } from "@/shared/api/clientApi";
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

type OutputResponse = {
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

type TodoResponse = {
  id: number;
  title: string;
  done: boolean;
  taskId: number | null;
  plannedFor: string;
};

type MemoryResponse = {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  task: { id: number; title: string } | null;
  originLog: { id: number; title: string } | null;
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

export async function fetchWorkspaceDashboard(workspaceId: string) {
  const { from, to } = getDashboardDateRange();
  const response = await clientApi<WorkspaceDashboardResponse>(
    `/api/workspaces/${workspaceId}/dashboard?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
  return mapDashboard(response);
}

export async function fetchWorkspaceTasks(workspaceId: string) {
  const response = await clientApi<WorkspaceTaskCursorResponse>(
    `/api/workspaces/${workspaceId}/tasks?size=50`,
  );
  return response.tasks.map(mapTask);
}

export async function fetchWorkspaceLogs(workspaceId: string) {
  const response = await clientApi<WorkspaceLogCursorResponse>(
    `/api/workspaces/${workspaceId}/logs?size=50`,
  );
  return response.logs.map(mapLog);
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

export function buildWorkspaceUiData(
  bootstrap: AppBootstrap,
  workspaceId: string,
  partial: Partial<WorkspaceUiData>,
): WorkspaceUiData | null {
  const workspace = bootstrap.workspaces.find((item) => item.id === workspaceId);
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

function mapDashboard(response: WorkspaceDashboardResponse): Partial<WorkspaceUiData> {
  const tasks = response.tasks.map(mapTask);
  const logs = response.logs.map(mapLog);
  const doingCount = tasks.filter((task) => task.status === "doing").length;
  const todoCount = tasks.filter((task) => task.status === "todo").length;

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
      fromType: link.fromType.toLowerCase() as WorkspaceCrossLinkItem["fromType"],
      fromNodeId: String(link.fromNodeId),
      toType: link.toType.toLowerCase() as WorkspaceCrossLinkItem["toType"],
      toNodeId: String(link.toNodeId),
      relation: link.relation,
    })),
    memories: response.memories.map(mapMemory),
    activity: response.activity,
    navigationSummary: response.navigationSummary ?? {
      activeTaskCount: doingCount || todoCount,
      logsCount: logs.length,
      openIssuesCount: logs.filter(
        (log) => log.kind === "ISSUE" && log.status !== "CLOSED",
      ).length,
    },
    workingBrief: response.workingBrief
      ? {
          title: response.workingBrief.title,
          prose: response.workingBrief.prose,
          taskId:
            response.workingBrief.taskId === null
              ? undefined
              : String(response.workingBrief.taskId),
          taskTitle: response.workingBrief.taskTitle ?? undefined,
          branch: response.workingBrief.branch ?? undefined,
          updatedLabel: formatWorkspaceDateLabel(response.workingBrief.updatedAt),
        }
      : null,
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

function mapOutput(output: OutputResponse): WorkspaceTaskOutput {
  const taskIds = (output.taskIds ?? []).map(String);
  const logIds = (output.logIds ?? []).map(String);
  const status: WorkspaceOutputStatus =
    output.status === "EXPORTED" ? "exported" : "draft";
  return {
    id: String(output.id),
    taskId: taskIds[0] ?? "",
    taskIds,
    logIds,
    taskCount: output.taskCount,
    logCount: output.logCount,
    status,
    title: output.title,
    description: `${output.taskCount} task${output.taskCount === 1 ? "" : "s"} · ${output.logCount} log${output.logCount === 1 ? "" : "s"}`,
    content: "",
    updatedLabel: formatWorkspaceDateLabel(output.updatedAt),
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
