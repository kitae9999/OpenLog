"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { API_CONFIG } from "@/shared/api";
import {
  getWorkspaceDashboardRefreshData,
  type WorkspaceDashboardRefreshData,
} from "@/entities/workspace/api/workspaceApi";
import type {
  WorkspaceCrossLinkRelation,
  WorkspaceNodeKind,
} from "@/entities/workspace/model/workspaceTypes";

type TaskStatus = "TODO" | "DOING" | "DONE";
type LogStatus = "NONE" | "OPEN" | "CLOSED";

export type WorkspaceActionResult = {
  ok: boolean;
  id?: string;
  href?: string;
  message?: string;
};

export type WorkspaceDashboardRefreshResult =
  | { ok: true; data: WorkspaceDashboardRefreshData }
  | { ok: false; message: string };

type LogKind = "ISSUE" | "FIX" | "DECISION" | "NOTE";

export async function refreshWorkspaceDashboard(
  workspaceId: string,
): Promise<WorkspaceDashboardRefreshResult> {
  try {
    return {
      ok: true,
      data: await getWorkspaceDashboardRefreshData(workspaceId),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Workspace refresh failed.",
    };
  }
}

export async function createWorkspace(input: {
  slug: string;
  name: string;
  repoFullName?: string | null;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    const workspace = await requestJson<{ id: number }>(
      "/workspaces",
      cookie,
      {
        method: "POST",
        body: JSON.stringify({
          slug: input.slug,
          name: input.name,
          repoFullName: input.repoFullName?.trim() || null,
        }),
      },
    );

    const workspaceId = String(workspace.id);
    return { ok: true, id: workspaceId, href: "/dashboard" };
  });
}

export async function updateWorkspace(input: {
  workspaceId: string;
  name: string;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(`/workspaces/${input.workspaceId}`, cookie, {
      method: "PUT",
      body: JSON.stringify({
        name: input.name,
      }),
    });

    return { ok: true, id: input.workspaceId };
  });
}

export async function createWorkspaceTask(input: {
  workspaceId: string;
  title: string;
  description?: string | null;
  content?: string | null;
  status?: TaskStatus;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    const task = await requestJson<{ id: number }>(
      `/workspaces/${input.workspaceId}/tasks`,
      cookie,
      {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          description: input.description ?? null,
          content: input.content ?? null,
          status: input.status ?? "TODO",
        }),
      },
    );

    const taskId = String(task.id);
    return { ok: true, id: taskId, href: `/tasks/${taskId}` };
  });
}

export async function updateWorkspaceTask(input: {
  workspaceId: string;
  taskId: string;
  title: string;
  description?: string | null;
  content: string;
  status: TaskStatus;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(`/workspaces/${input.workspaceId}/tasks/${input.taskId}`, cookie, {
      method: "PUT",
      body: JSON.stringify({
        title: input.title,
        description: input.description ?? null,
        content: input.content,
        status: input.status,
      }),
    });

    return { ok: true };
  });
}

export async function deleteWorkspaceTask(input: {
  workspaceId: string;
  taskId: string;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(
      `/workspaces/${input.workspaceId}/tasks/${input.taskId}`,
      cookie,
      { method: "DELETE" },
    );

    return { ok: true, href: "/tasks" };
  });
}

export async function deleteWorkspaceDocuments(input: {
  workspaceId: string;
  documentType: "tasks" | "logs" | "outputs" | "memories";
  ids: string[];
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(
      `/workspaces/${input.workspaceId}/${input.documentType}/bulk-delete`,
      cookie,
      {
        method: "POST",
        body: JSON.stringify({ ids: input.ids.map(Number) }),
      },
    );

    return { ok: true };
  });
}

export async function createWorkspaceLog(input: {
  workspaceId: string;
  kind: LogKind;
  title: string;
  content: string;
  summary?: string | null;
  taskId?: string | null;
  status?: LogStatus | null;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    const log = await requestJson<{ id: number }>(
      `/workspaces/${input.workspaceId}/logs`,
      cookie,
      {
        method: "POST",
        body: JSON.stringify({
          kind: input.kind,
          title: input.title,
          content: input.content,
          summary: input.summary ?? null,
          taskId: input.taskId ? Number(input.taskId) : null,
          status: input.status ?? null,
        }),
      },
    );

    const logId = String(log.id);
    return { ok: true, id: logId, href: `/logs/${logId}` };
  });
}

export async function updateWorkspaceLog(input: {
  workspaceId: string;
  logId: string;
  title: string;
  content: string;
  summary?: string | null;
  taskId?: string | null;
  status: LogStatus;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(`/workspaces/${input.workspaceId}/logs/${input.logId}`, cookie, {
      method: "PUT",
      body: JSON.stringify({
        title: input.title,
        content: input.content,
        summary: input.summary ?? null,
        taskId: input.taskId ? Number(input.taskId) : null,
        status: input.status,
      }),
    });

    return { ok: true };
  });
}

export async function deleteWorkspaceLog(input: {
  workspaceId: string;
  logId: string;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(
      `/workspaces/${input.workspaceId}/logs/${input.logId}`,
      cookie,
      { method: "DELETE" },
    );

    return { ok: true, href: "/logs" };
  });
}

export async function createWorkspaceTaskLink(input: {
  workspaceId: string;
  fromTaskId: string;
  toTaskId: string;
  relation: "PRECEDES" | "BLOCKS" | "RELATES_TO";
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(`/workspaces/${input.workspaceId}/task-links`, cookie, {
      method: "POST",
      body: JSON.stringify({
        fromTaskId: Number(input.fromTaskId),
        toTaskId: Number(input.toTaskId),
        relation: input.relation,
      }),
    });

    return { ok: true };
  });
}

export async function deleteWorkspaceTaskLink(input: {
  workspaceId: string;
  taskLinkId: string;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(
      `/workspaces/${input.workspaceId}/task-links/${input.taskLinkId}`,
      cookie,
      { method: "DELETE" },
    );

    return { ok: true };
  });
}

export async function createWorkspaceLogLink(input: {
  workspaceId: string;
  fromLogId: string;
  toLogId: string;
  relation: "FIXES" | "RELATES_TO" | "SUPERSEDES";
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(`/workspaces/${input.workspaceId}/log-links`, cookie, {
      method: "POST",
      body: JSON.stringify({
        fromLogId: Number(input.fromLogId),
        toLogId: Number(input.toLogId),
        relation: input.relation,
      }),
    });

    return { ok: true };
  });
}

export async function deleteWorkspaceLogLink(input: {
  workspaceId: string;
  logLinkId: string;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(
      `/workspaces/${input.workspaceId}/log-links/${input.logLinkId}`,
      cookie,
      { method: "DELETE" },
    );

    return { ok: true };
  });
}

export async function createWorkspaceCrossLink(input: {
  workspaceId: string;
  fromType: WorkspaceNodeKind;
  fromNodeId: string;
  toType: WorkspaceNodeKind;
  toNodeId: string;
  relation: WorkspaceCrossLinkRelation;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(`/workspaces/${input.workspaceId}/cross-links`, cookie, {
      method: "POST",
      body: JSON.stringify({
        fromType: input.fromType.toUpperCase(),
        fromNodeId: Number(input.fromNodeId),
        toType: input.toType.toUpperCase(),
        toNodeId: Number(input.toNodeId),
        relation: input.relation,
      }),
    });

    return { ok: true };
  });
}

export async function deleteWorkspaceCrossLink(input: {
  workspaceId: string;
  crossLinkId: string;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(
      `/workspaces/${input.workspaceId}/cross-links/${input.crossLinkId}`,
      cookie,
      { method: "DELETE" },
    );

    return { ok: true };
  });
}

export async function createWorkspaceMemory(input: {
  workspaceId: string;
  title: string;
  content: string;
  taskId?: string | null;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    const memory = await requestJson<{ id: number }>(
      `/workspaces/${input.workspaceId}/memories`,
      cookie,
      {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          content: input.content,
          taskId: input.taskId ? Number(input.taskId) : null,
        }),
      },
    );
    const memoryId = String(memory.id);
    return { ok: true, id: memoryId, href: `/memory/${memoryId}` };
  });
}

export async function createWorkspaceMemoryFromLog(input: {
  workspaceId: string;
  logId: string;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    const memory = await requestJson<{ id: number }>(
      `/workspaces/${input.workspaceId}/logs/${input.logId}/memory`,
      cookie,
      { method: "POST" },
    );
    const memoryId = String(memory.id);
    return { ok: true, id: memoryId, href: `/memory/${memoryId}` };
  });
}

export async function updateWorkspaceMemory(input: {
  workspaceId: string;
  memoryId: string;
  title: string;
  content: string;
  taskId?: string | null;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(
      `/workspaces/${input.workspaceId}/memories/${input.memoryId}`,
      cookie,
      {
        method: "PUT",
        body: JSON.stringify({
          title: input.title,
          content: input.content,
          taskId: input.taskId ? Number(input.taskId) : null,
        }),
      },
    );
    return { ok: true, href: `/memory/${input.memoryId}` };
  });
}

export async function deleteWorkspaceMemory(input: {
  workspaceId: string;
  memoryId: string;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(
      `/workspaces/${input.workspaceId}/memories/${input.memoryId}`,
      cookie,
      { method: "DELETE" },
    );
    return { ok: true, href: "/memory" };
  });
}

export async function createWorkspaceTodo(input: {
  workspaceId: string;
  title: string;
  plannedFor: string;
  taskId?: string;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    const todo = await requestJson<{ id: number }>(
      `/workspaces/${input.workspaceId}/todos`,
      cookie,
      {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          plannedFor: input.plannedFor,
          taskId: input.taskId ? Number(input.taskId) : null,
        }),
      },
    );

    return { ok: true, id: String(todo.id) };
  });
}

export async function updateWorkspaceTodoDone(input: {
  workspaceId: string;
  todoId: string;
  done: boolean;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(
      `/workspaces/${input.workspaceId}/todos/${input.todoId}`,
      cookie,
      {
        method: "PATCH",
        body: JSON.stringify({
          done: input.done,
        }),
      },
    );

    return { ok: true, id: input.todoId };
  });
}

export async function deleteWorkspaceTodo(input: {
  workspaceId: string;
  todoId: string;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    const response = await fetch(
      `${API_CONFIG.baseURL}/workspaces/${input.workspaceId}/todos/${input.todoId}`,
      {
        method: "DELETE",
        cache: "no-store",
        headers: {
          accept: "application/json",
          cookie,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Workspace API request failed: ${response.status}`);
    }

    return { ok: true };
  });
}

export async function deleteWorkspace(input: {
  workspaceId: string;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    const response = await fetch(
      `${API_CONFIG.baseURL}/workspaces/${input.workspaceId}`,
      {
        method: "DELETE",
        cache: "no-store",
        headers: {
          accept: "application/json",
          cookie,
        },
      },
    );

    if (!response.ok) {
      throw new Error(await getWorkspaceErrorMessage(response));
    }

    return { ok: true };
  });
}

export async function createWorkspaceOutput(input: {
  workspaceId: string;
  title: string;
  content: string;
  taskIds: string[];
  logIds: string[];
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    const output = await requestJson<{ id: number }>(
      `/workspaces/${input.workspaceId}/outputs`,
      cookie,
      {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          content: input.content,
          taskIds: input.taskIds.map(Number),
          logIds: input.logIds.map(Number),
        }),
      },
    );

    return { ok: true, id: String(output.id), href: `/outputs/${output.id}` };
  });
}

export async function updateWorkspaceOutput(input: {
  workspaceId: string;
  outputId: string;
  title: string;
  content: string;
  taskIds: string[];
  logIds: string[];
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(`/workspaces/${input.workspaceId}/outputs/${input.outputId}`, cookie, {
      method: "PUT",
      body: JSON.stringify({
        title: input.title,
        content: input.content,
        taskIds: input.taskIds.map(Number),
        logIds: input.logIds.map(Number),
      }),
    });

    return { ok: true };
  });
}

export async function createPostDraftFromOutput(input: {
  workspaceId: string;
  outputId: string;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    const output = await requestJson<{
      linkedPost: { id: number } | null;
    }>(`/workspaces/${input.workspaceId}/outputs/${input.outputId}/post-draft`, cookie, {
      method: "POST",
    });

    revalidatePath("/");
    return {
      ok: true,
      href: output.linkedPost
        ? `/posts/${output.linkedPost.id}/edit`
        : undefined,
    };
  });
}

async function mutateWorkspace(
  mutation: (cookie: string) => Promise<WorkspaceActionResult>,
): Promise<WorkspaceActionResult> {
  try {
    const headerStore = await headers();
    return await mutation(headerStore.get("cookie") ?? "");
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Workspace request failed.",
    };
  }
}

async function requestJson<T = unknown>(
  path: string,
  cookie: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_CONFIG.baseURL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      cookie,
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await getWorkspaceErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();
  return responseText ? (JSON.parse(responseText) as T) : (undefined as T);
}

async function getWorkspaceErrorMessage(response: Response) {
  let errorBody: { message?: string } | null = null;

  try {
    errorBody = (await response.json()) as { message?: string };
  } catch {
    errorBody = null;
  }

  return (
    errorBody?.message ?? `Workspace API request failed: ${response.status}`
  );
}
