"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { API_CONFIG } from "@/shared/api";

type TaskStatus = "TODO" | "DOING" | "DONE";
type LogStatus = "NONE" | "OPEN" | "CLOSED";

export type WorkspaceActionResult = {
  ok: boolean;
  id?: string;
  href?: string;
  message?: string;
};

type LogKind = "ISSUE" | "FIX" | "DECISION" | "NOTE";

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
    revalidatePath("/");
    revalidatePath("/settings/manage");
    revalidatePath("/workspaces/new");
    return { ok: true, id: workspaceId, href: "/" };
  });
}

export async function updateWorkspace(input: {
  workspaceId: string;
  name: string;
  repoFullName?: string | null;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    await requestJson(`/workspaces/${input.workspaceId}`, cookie, {
      method: "PUT",
      body: JSON.stringify({
        name: input.name,
        repoFullName: input.repoFullName?.trim() || null,
      }),
    });

    revalidatePath("/");
    revalidatePath("/settings/manage");
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
    revalidateWorkspacePaths(taskId);
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

    revalidateWorkspacePaths(input.taskId);
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

    revalidateWorkspaceCollectionPaths();
    return { ok: true, href: "/tasks" };
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
    revalidatePath(`/logs/${logId}`);
    revalidatePath("/logs");
    revalidatePath("/");
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

    revalidatePath(`/logs/${input.logId}`);
    revalidatePath(`/logs/${input.logId}/edit`);
    revalidatePath("/logs");
    revalidatePath("/");
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

    revalidateWorkspaceCollectionPaths();
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

    revalidatePath("/graph");
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

    revalidatePath("/graph");
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

    revalidatePath("/graph");
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

    revalidatePath("/graph");
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
    revalidateMemoryPaths(memoryId);
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
    revalidateMemoryPaths(memoryId);
    revalidatePath(`/logs/${input.logId}`);
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
    revalidateMemoryPaths(input.memoryId);
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
    revalidateMemoryPaths(input.memoryId);
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

    revalidatePath("/");
    revalidatePath("/planner");
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

    revalidatePath("/");
    revalidatePath("/planner");
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

    revalidatePath("/");
    revalidatePath("/planner");
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

    revalidatePath("/");
    revalidatePath("/settings/manage");
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

    revalidatePath("/outputs");
    revalidatePath("/");
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

    revalidatePath(`/outputs/${input.outputId}`);
    revalidatePath("/outputs");
    revalidatePath("/");
    return { ok: true };
  });
}

export async function publishWorkspaceOutput(input: {
  workspaceId: string;
  outputId: string;
}): Promise<WorkspaceActionResult> {
  return mutateWorkspace(async (cookie) => {
    const output = await requestJson<{
      publishedPost: { authorUsername: string; slug: string } | null;
    }>(`/workspaces/${input.workspaceId}/outputs/${input.outputId}/publish`, cookie, {
      method: "POST",
      body: JSON.stringify({
        description: "Published from OpenLog output.",
        topics: [],
      }),
    });

    revalidatePath(`/outputs/${input.outputId}`);
    revalidatePath("/outputs");
    revalidatePath("/");
    return {
      ok: true,
      href: output.publishedPost
        ? `/@${output.publishedPost.authorUsername}/posts/${output.publishedPost.slug}`
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

function revalidateMemoryPaths(memoryId: string) {
  revalidatePath("/");
  revalidatePath("/graph");
  revalidatePath("/memory");
  revalidatePath(`/memory/${memoryId}`);
  revalidatePath(`/memory/${memoryId}/edit`);
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

function revalidateWorkspacePaths(taskId: string) {
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/tasks/${taskId}/edit`);
  revalidatePath("/tasks");
  revalidatePath("/");
}

function revalidateWorkspaceCollectionPaths() {
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/logs");
  revalidatePath("/outputs");
  revalidatePath("/memory");
  revalidatePath("/graph");
  revalidatePath("/activity");
}
