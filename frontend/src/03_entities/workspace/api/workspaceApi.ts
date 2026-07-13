import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { API_CONFIG } from "@/shared/api";
import { todayIso } from "@/shared/lib/todayIso";
import { buildPublicPostPath } from "@/shared/lib/publicRoutes";
import {
  getLogHref,
  type WorkspaceLogItem,
  type WorkspaceOutputStatus,
  type WorkspaceTaskOutput,
  type WorkspaceTodoItem,
  type WorkspaceWorkItem,
  type WorkspaceWorkStatus,
} from "@/entities/workspace/model/data";
import type {
  ManagedWorkspace,
  WorkspaceActivity,
  WorkspaceCrossLinkItem,
  WorkspaceLogLinkItem,
  WorkspaceMemoryItem,
  WorkspaceTaskLinkItem,
  WorkspaceUiData,
} from "@/entities/workspace/model/workspaceTypes";

const ACTIVE_WORKSPACE_COOKIE = "openlog-active-workspace";

type WorkspaceResponse = {
  id: number;
  slug: string;
  name: string;
  repoFullName: string | null;
};

export type WorkspacePageData = {
  workspaces: ManagedWorkspace[];
  workspaceData: WorkspaceUiData | null;
  status: "ready" | "empty" | "error";
};

type TaskStatus = "TODO" | "DOING" | "DONE";
type LogKind = "ISSUE" | "FIX" | "DECISION" | "NOTE";
type LogStatus = "NONE" | "OPEN" | "CLOSED";
type OutputStatus = "DRAFT" | "EXPORTED" | "PUBLISHED";

type WorkspaceTaskResponse = {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

type WorkspaceTaskCursorResponse = {
  tasks: WorkspaceTaskResponse[];
  nextCursor: string | null;
  hasNext: boolean;
};

type WorkspaceLogResponse = {
  id: number;
  kind: LogKind;
  status: LogStatus;
  title: string;
  summary: string | null;
  taskId: number | null;
  createdAt: string;
};

type WorkspaceLogDetailResponse = WorkspaceLogResponse & {
  content: string;
  updatedAt: string;
  closedAt: string | null;
};

type WorkspaceLogCursorResponse = {
  logs: WorkspaceLogResponse[];
  nextCursor: string | null;
  hasNext: boolean;
};

type TaskLinkResponse = {
  id: number;
  fromTask: WorkspaceTaskResponse;
  toTask: WorkspaceTaskResponse;
  relation: WorkspaceTaskLinkItem["relation"];
};

type LogLinkResponse = {
  id: number;
  fromLog: WorkspaceLogResponse;
  toLog: WorkspaceLogResponse;
  relation: WorkspaceLogLinkItem["relation"];
};

type CrossLinkResponse = {
  id: number;
  fromType: Uppercase<WorkspaceCrossLinkItem["fromType"]>;
  fromNodeId: number;
  toType: Uppercase<WorkspaceCrossLinkItem["toType"]>;
  toNodeId: number;
  relation: WorkspaceCrossLinkItem["relation"];
};

type TodoResponse = {
  id: number;
  title: string;
  done: boolean;
  taskId: number | null;
  plannedFor: string;
};

type OutputResponse = {
  id: number;
  status: OutputStatus;
  title: string;
  taskCount: number;
  logCount: number;
  taskIds: number[];
  logIds: number[];
  updatedAt: string;
  publishedAt: string | null;
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
  publishedPost: { authorUsername: string; slug: string } | null;
  updatedAt: string;
  publishedAt: string | null;
};

type WorkspaceApiSnapshot = {
  workspace: WorkspaceResponse;
  tasks: WorkspaceTaskResponse[];
  logs: WorkspaceLogResponse[];
  outputs: OutputResponse[];
  todos: TodoResponse[];
  taskLinks: TaskLinkResponse[];
  logLinks: LogLinkResponse[];
  crossLinks: CrossLinkResponse[];
  memories: MemoryResponse[];
  workingBrief: WorkingBriefResponse | null;
};

type WorkingBriefResponse = {
  title: string;
  prose: string;
  taskId: number | null;
  taskTitle: string | null;
  branch: string | null;
  updatedAt: string;
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

type MemoryCursorResponse = {
  memories: MemoryResponse[];
  nextCursor: string | null;
  hasNext: boolean;
};

type ActivityDayLogsResponse = {
  date: string;
  logs: WorkspaceLogResponse[];
};

export const listManagedWorkspaces = cache(
  async (): Promise<ManagedWorkspace[]> => {
    try {
      const headerStore = await headers();
      const cookie = headerStore.get("cookie") ?? "";
      const workspaces = await fetchJson<WorkspaceResponse[]>(
        "/workspaces",
        cookie,
      );

      return workspaces.map(mapManagedWorkspace);
    } catch {
      return [];
    }
  },
);

export const loadWorkspacePageData = cache(
  async (): Promise<WorkspacePageData> => {
    try {
      const headerStore = await headers();
      const cookie = headerStore.get("cookie") ?? "";
      const workspaceResponses = await fetchJson<WorkspaceResponse[]>(
        "/workspaces",
        cookie,
      );
      const workspaces = workspaceResponses.map(mapManagedWorkspace);

      if (workspaces.length === 0) {
        return { workspaces, workspaceData: null, status: "empty" };
      }

      const selectedId = resolveSelectedWorkspaceId(workspaces, cookie);
      const workspaceData = await fetchWorkspaceUiData(
        workspaceResponses,
        cookie,
        selectedId,
      );
      return { workspaces, workspaceData, status: "ready" };
    } catch {
      return { workspaces: [], workspaceData: null, status: "error" };
    }
  },
);

export const getWorkspaceUiData = cache(
  async (workspaceId?: string | null): Promise<WorkspaceUiData | null> => {
    try {
      const headerStore = await headers();
      const cookie = headerStore.get("cookie") ?? "";
      const workspaces = await fetchJson<WorkspaceResponse[]>(
        "/workspaces",
        cookie,
      );
      return await fetchWorkspaceUiData(workspaces, cookie, workspaceId);
    } catch {
      return null;
    }
  },
);

export const getWorkspaceLog = cache(
  async (
    workspaceId: string,
    logId: string,
  ): Promise<WorkspaceLogItem | null> => {
    try {
      const headerStore = await headers();
      const log = await fetchJson<WorkspaceLogDetailResponse>(
        `/workspaces/${workspaceId}/logs/${logId}`,
        headerStore.get("cookie") ?? "",
      );
      return mapLog(log);
    } catch {
      return null;
    }
  },
);

export const getWorkspaceOutput = cache(
  async (
    workspaceId: string,
    outputId: string,
  ): Promise<WorkspaceTaskOutput | null> => {
    try {
      const headerStore = await headers();
      const output = await fetchJson<OutputDetailResponse>(
        `/workspaces/${workspaceId}/outputs/${outputId}`,
        headerStore.get("cookie") ?? "",
      );
      return mapOutput(output);
    } catch {
      return null;
    }
  },
);

async function fetchWorkspaceUiData(
  workspaces: WorkspaceResponse[],
  cookie: string,
  workspaceId?: string | null,
): Promise<WorkspaceUiData | null> {
  if (workspaces.length === 0) {
    return null;
  }

  const selected =
    (workspaceId
      ? workspaces.find((workspace) => String(workspace.id) === workspaceId)
      : null) ??
    workspaces.find(
      (workspace) =>
        String(workspace.id) === readActiveWorkspaceIdFromCookie(cookie),
    ) ??
    workspaces[0];

  if (!selected) {
    return null;
  }

  const selectedId = selected.id;
  const [
    tasks,
    logs,
    taskLinks,
    logLinks,
    crossLinks,
    todos,
    outputSummaries,
    memories,
    workingBrief,
  ] = await Promise.all([
      fetchAllTasks(selectedId, cookie),
      fetchAllLogs(selectedId, cookie),
      fetchJson<TaskLinkResponse[]>(
        `/workspaces/${selectedId}/task-links`,
        cookie,
      ),
      fetchJson<LogLinkResponse[]>(
        `/workspaces/${selectedId}/log-links`,
        cookie,
      ),
      fetchJson<CrossLinkResponse[]>(
        `/workspaces/${selectedId}/cross-links`,
        cookie,
      ).catch(() => []),
      fetchJson<TodoResponse[]>(
        `/workspaces/${selectedId}/todos?plannedFor=${todayIso()}`,
        cookie,
      ),
      fetchOutputs(selectedId, cookie),
      // A newly deployed optional feature must not make the existing
      // workspace snapshot disappear while its backend rolls out.
      fetchAllMemories(selectedId, cookie).catch(() => []),
      fetchJson<WorkingBriefResponse>(
        `/workspaces/${selectedId}/working-brief`,
        cookie,
      ).catch(() => null),
    ]);

  return mapWorkspaceSnapshot({
    workspace: selected,
    tasks,
    logs,
    outputs: outputSummaries,
    todos,
    taskLinks,
    logLinks,
    crossLinks,
    memories,
    workingBrief,
  });
}

export const getWorkspaceMemory = cache(
  async (workspaceId: string, memoryId: string): Promise<WorkspaceMemoryItem | null> => {
    try {
      const headerStore = await headers();
      const response = await fetchJson<MemoryResponse>(
        `/workspaces/${workspaceId}/memories/${memoryId}`,
        headerStore.get("cookie") ?? "",
      );
      return mapMemory(response);
    } catch {
      return null;
    }
  },
);

export async function getWorkspaceActivity(
  workspaceId: string,
  from: string,
  to: string,
): Promise<WorkspaceActivity | null> {
  try {
    const headerStore = await headers();
    return await fetchJson<WorkspaceActivity>(
      `/workspaces/${workspaceId}/activity?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      headerStore.get("cookie") ?? "",
    );
  } catch {
    return null;
  }
}

export async function getWorkspaceActivityDayLogs(
  workspaceId: string,
  date: string,
): Promise<WorkspaceLogItem[]> {
  try {
    const headerStore = await headers();
    const response = await fetchJson<ActivityDayLogsResponse>(
      `/workspaces/${workspaceId}/activity/${date}/logs`,
      headerStore.get("cookie") ?? "",
    );
    return response.logs.map((log) => mapLog({
      ...log,
      content: log.summary ?? "",
      updatedAt: log.createdAt,
      closedAt: null,
    }));
  } catch {
    return [];
  }
}

export async function getWorkspaceTodosInRange(
  workspaceId: string,
  from: string,
  to: string,
): Promise<WorkspaceTodoItem[] | null> {
  try {
    const headerStore = await headers();
    const response = await fetchJson<TodoResponse[]>(
      `/workspaces/${workspaceId}/todos?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      headerStore.get("cookie") ?? "",
    );
    return response.map(mapTodo);
  } catch {
    return null;
  }
}

function mapManagedWorkspace(workspace: WorkspaceResponse): ManagedWorkspace {
  return {
    id: String(workspace.id),
    slug: workspace.slug,
    name: workspace.name || workspace.slug,
    repoFullName: workspace.repoFullName,
  };
}

function resolveSelectedWorkspaceId(
  workspaces: ManagedWorkspace[],
  cookieHeader: string,
) {
  const cookieId = readActiveWorkspaceIdFromCookie(cookieHeader);
  if (cookieId && workspaces.some((workspace) => workspace.id === cookieId)) {
    return cookieId;
  }

  return workspaces[0]?.id ?? null;
}

function readActiveWorkspaceIdFromCookie(cookieHeader: string) {
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ACTIVE_WORKSPACE_COOKIE}=`));

  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match.slice(`${ACTIVE_WORKSPACE_COOKIE}=`.length));
  } catch {
    return null;
  }
}

async function fetchAllTasks(workspaceId: number, cookie: string) {
  const tasks: WorkspaceTaskResponse[] = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const params = new URLSearchParams({ size: "50" });
    if (cursor) params.set("cursor", cursor);
    const page = await fetchJson<WorkspaceTaskCursorResponse>(
      `/workspaces/${workspaceId}/tasks?${params}`,
      cookie,
    );
    tasks.push(...page.tasks);
    cursor = page.nextCursor;
    hasNext = page.hasNext && !!cursor;
  }

  return tasks;
}

async function fetchOutputs(workspaceId: number, cookie: string) {
  return fetchJson<OutputResponse[]>(
    `/workspaces/${workspaceId}/outputs`,
    cookie,
  );
}

async function fetchAllMemories(workspaceId: number, cookie: string) {
  const memories: MemoryResponse[] = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const params = new URLSearchParams({ size: "50" });
    if (cursor) params.set("cursor", cursor);
    const page = await fetchJson<MemoryCursorResponse>(
      `/workspaces/${workspaceId}/memories?${params}`,
      cookie,
    );
    memories.push(...page.memories);
    cursor = page.nextCursor;
    hasNext = page.hasNext && !!cursor;
  }

  return memories;
}

async function fetchAllLogs(workspaceId: number, cookie: string) {
  const logs: WorkspaceLogResponse[] = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const params = new URLSearchParams({ size: "50" });
    if (cursor) params.set("cursor", cursor);
    const page = await fetchJson<WorkspaceLogCursorResponse>(
      `/workspaces/${workspaceId}/logs?${params}`,
      cookie,
    );
    logs.push(...page.logs);
    cursor = page.nextCursor;
    hasNext = page.hasNext && !!cursor;
  }

  return logs;
}

async function fetchJson<T>(path: string, cookie: string): Promise<T> {
  const response = await fetch(`${API_CONFIG.baseURL}${path}`, {
    cache: "no-store",
    headers: {
      accept: "application/json",
      cookie,
    },
  });

  if (!response.ok) {
    throw new Error(`Workspace API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function mapWorkspaceSnapshot(snapshot: WorkspaceApiSnapshot): WorkspaceUiData {
  const logs = snapshot.logs.map(mapLog);
  const tasks = snapshot.tasks.map(mapTask);
  const outputs = snapshot.outputs.map(mapOutput);

  return {
    workspaceId: String(snapshot.workspace.id),
    workspaceName: snapshot.workspace.name || snapshot.workspace.slug,
    repositoryFullName: snapshot.workspace.repoFullName,
    tasks,
    logs,
    outputs,
    todos: snapshot.todos.map(mapTodo),
    taskLinks: snapshot.taskLinks.map((link) => ({
      id: String(link.id),
      fromTaskId: String(link.fromTask.id),
      toTaskId: String(link.toTask.id),
      relation: link.relation,
    })),
    logLinks: snapshot.logLinks.map((link) => ({
      id: String(link.id),
      fromLogId: String(link.fromLog.id),
      toLogId: String(link.toLog.id),
      relation: link.relation,
    })),
    crossLinks: snapshot.crossLinks.map((link) => ({
      id: String(link.id),
      fromType: link.fromType.toLowerCase() as WorkspaceCrossLinkItem["fromType"],
      fromNodeId: String(link.fromNodeId),
      toType: link.toType.toLowerCase() as WorkspaceCrossLinkItem["toType"],
      toNodeId: String(link.toNodeId),
      relation: link.relation,
    })),
    memories: snapshot.memories.map(mapMemory),
    workingBrief: snapshot.workingBrief
      ? mapWorkingBrief(snapshot.workingBrief)
      : null,
  };
}

function mapWorkingBrief(brief: WorkingBriefResponse) {
  return {
    title: brief.title,
    prose: brief.prose,
    taskId: brief.taskId != null ? String(brief.taskId) : undefined,
    taskTitle: brief.taskTitle ?? undefined,
    branch: brief.branch ?? undefined,
    updatedLabel: formatDateLabel(brief.updatedAt),
  };
}

function mapMemory(memory: MemoryResponse): WorkspaceMemoryItem {
  return {
    id: String(memory.id),
    title: memory.title,
    content: memory.content,
    excerpt: memory.excerpt,
    task: memory.task ? { id: String(memory.task.id), title: memory.task.title } : null,
    originLog: memory.originLog
      ? { id: String(memory.originLog.id), title: memory.originLog.title }
      : null,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  };
}

function mapTask(task: WorkspaceTaskResponse): WorkspaceWorkItem {
  return {
    id: String(task.id),
    title: task.title,
    description: task.description,
    status: mapTaskStatus(task.status),
    apiStatus: task.status,
    body: task.content ?? task.description ?? "",
  };
}

function mapLog(
  log: WorkspaceLogResponse | WorkspaceLogDetailResponse,
): WorkspaceLogItem {
  const label = mapLogLabel(log.kind);
  const content = "content" in log ? log.content : undefined;
  const description = log.summary ?? (content ? excerpt(content) : "");

  return {
    id: String(log.id),
    tone: mapLogTone(log.kind),
    label,
    kind: log.kind,
    status: log.status,
    title: log.title,
    description,
    summary: log.summary ?? undefined,
    meta: buildLogMeta(log),
    href: getLogHref(String(log.id)),
    taskId: log.taskId ? String(log.taskId) : undefined,
    body: content,
    createdAt: log.createdAt,
  };
}

function mapOutput(
  output: OutputDetailResponse | OutputResponse,
): WorkspaceTaskOutput {
  const isDetail = "content" in output;
  const taskIds = isDetail
    ? output.tasks.map((task) => String(task.id))
    : output.taskIds.map(String);
  const logIds = isDetail
    ? output.logs.map((log) => String(log.id))
    : output.logIds.map(String);
  const taskCount = isDetail ? taskIds.length : output.taskCount;
  const logCount = isDetail ? logIds.length : output.logCount;
  const status = mapOutputStatus(output.status);

  return {
    id: String(output.id),
    taskId: taskIds[0] ?? "",
    taskIds,
    logIds,
    taskCount,
    logCount,
    status,
    title: output.title,
    description: [
      `${taskCount} task${taskCount === 1 ? "" : "s"}`,
      `${logCount} log${logCount === 1 ? "" : "s"}`,
    ].join(" · "),
    content: isDetail ? output.content : "",
    updatedLabel: formatDateLabel(output.updatedAt),
    publishedHref:
      isDetail && output.publishedPost
        ? buildPublicPostPath(
            output.publishedPost.authorUsername,
            output.publishedPost.slug,
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

function mapTaskStatus(status: TaskStatus): WorkspaceWorkStatus {
  switch (status) {
    case "DONE":
      return "done";
    case "DOING":
      return "doing";
    default:
      return "todo";
  }
}

function mapLogLabel(kind: LogKind) {
  switch (kind) {
    case "ISSUE":
      return "Issue";
    case "FIX":
      return "Fix";
    case "DECISION":
      return "Decision";
    default:
      return "Log";
  }
}

function mapLogTone(kind: LogKind): WorkspaceLogItem["tone"] {
  switch (kind) {
    case "ISSUE":
      return "amber";
    case "FIX":
      return "green";
    case "DECISION":
      return "blue";
    default:
      return "zinc";
  }
}

function mapOutputStatus(status: OutputStatus): WorkspaceOutputStatus {
  return status === "PUBLISHED" ? "published" : "draft";
}

function buildLogMeta(log: WorkspaceLogResponse | WorkspaceLogDetailResponse) {
  if (log.status === "OPEN") {
    return `open · ${formatDateLabel(log.createdAt)}`;
  }
  if (log.status === "CLOSED") {
    const closedAt = "closedAt" in log ? log.closedAt : null;
    return `closed · ${formatDateLabel(closedAt ?? log.createdAt)}`;
  }

  return formatDateLabel(log.createdAt);
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

function formatDateLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(date);
}
