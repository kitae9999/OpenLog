"use server";

import { headers } from "next/headers";
import { API_CONFIG } from "@/shared/api";
import type {
  WorkspaceCaptureMode,
  WorkspaceProjectItem,
} from "@/entities/workspace/model/workspaceTypes";

export type WorkspaceAgentActionResult = {
  ok: boolean;
  message?: string;
  guide?: {
    content: string;
    revision: number;
    updatedAt: string;
  };
};

export async function updateWorkspaceAgentGuide(input: {
  workspaceId: string;
  content: string;
}): Promise<WorkspaceAgentActionResult> {
  return mutate(async (cookie) => {
    const guide = await requestJson<{
      content: string;
      revision: number;
      updatedAt: string;
    }>(`/workspaces/${input.workspaceId}/agent-guide`, cookie, {
      method: "PUT",
      body: JSON.stringify({ content: input.content }),
    });
    return { ok: true, guide };
  });
}

export async function updateWorkspaceProjectCaptureMode(input: {
  project: WorkspaceProjectItem;
  captureMode: WorkspaceCaptureMode;
}): Promise<WorkspaceAgentActionResult> {
  return mutate(async (cookie) => {
    await requestJson(`/workspace-projects/${input.project.id}`, cookie, {
      method: "PATCH",
      body: JSON.stringify({
        workspaceId: Number(input.project.workspaceId),
        displayName: input.project.displayName,
        repositoryFullName: input.project.repositoryFullName,
        captureMode: input.captureMode,
      }),
    });
    return { ok: true };
  });
}

export async function disconnectWorkspaceProject(input: {
  workspaceId: string;
  projectId: string;
}): Promise<WorkspaceAgentActionResult> {
  return mutate(async (cookie) => {
    await requestJson(`/workspace-projects/${input.projectId}`, cookie, {
      method: "DELETE",
    });
    return { ok: true };
  });
}

async function mutate(
  operation: (cookie: string) => Promise<WorkspaceAgentActionResult>,
): Promise<WorkspaceAgentActionResult> {
  try {
    const headerStore = await headers();
    return await operation(headerStore.get("cookie") ?? "");
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Workspace Agent request failed.",
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
    throw new Error(await readErrorMessage(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? `Workspace Agent request failed: ${response.status}`;
  } catch {
    return `Workspace Agent request failed: ${response.status}`;
  }
}
