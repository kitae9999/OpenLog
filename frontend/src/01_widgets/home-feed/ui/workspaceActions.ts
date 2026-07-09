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
    throw new Error(`Workspace API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function revalidateWorkspacePaths(taskId: string) {
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/tasks/${taskId}/edit`);
  revalidatePath("/tasks");
  revalidatePath("/");
}
