import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { API_CONFIG } from "@/shared/api";
import type {
  ManagedWorkspace,
  WorkspaceProjectItem,
} from "@/entities/workspace/model/workspaceTypes";

type WorkspaceResponse = {
  id: number;
  slug: string;
  name: string;
  projects: WorkspaceProjectResponse[];
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

type WorkspaceAgentGuideResponse = {
  workspaceId: number;
  content: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceAgentSettingsData = {
  workspace: ManagedWorkspace;
  guide: {
    content: string;
    revision: number;
    createdAt: string;
    updatedAt: string;
  };
};

export const getWorkspaceAgentSettings = cache(
  async (workspaceId: string): Promise<WorkspaceAgentSettingsData | null> => {
    try {
      const headerStore = await headers();
      const cookie = headerStore.get("cookie") ?? "";
      const [workspace, guide] = await Promise.all([
        fetchJson<WorkspaceResponse>(`/workspaces/${workspaceId}`, cookie),
        fetchJson<WorkspaceAgentGuideResponse>(
          `/workspaces/${workspaceId}/agent-guide`,
          cookie,
        ),
      ]);

      return {
        workspace: {
          id: String(workspace.id),
          slug: workspace.slug,
          name: workspace.name || workspace.slug,
          projects: workspace.projects.map(mapProject),
        },
        guide: {
          content: guide.content,
          revision: guide.revision,
          createdAt: guide.createdAt,
          updatedAt: guide.updatedAt,
        },
      };
    } catch {
      return null;
    }
  },
);

function mapProject(project: WorkspaceProjectResponse): WorkspaceProjectItem {
  return {
    id: String(project.id),
    workspaceId: String(project.workspaceId),
    displayName: project.displayName,
    repositoryFullName: project.repositoryFullName,
    captureMode: project.captureMode,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
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
    throw new Error(`Workspace Agent API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}
