import type { User } from "@/entities/user/model/User";
import type {
  ManagedWorkspace,
  WorkspaceNavigationSummary,
  WorkspaceProjectItem,
} from "@/entities/workspace/model/workspaceTypes";

export type NotificationSummary = {
  unreadCount: number;
};

export type AppBootstrap = {
  user: User;
  workspaces: ManagedWorkspace[];
  activeWorkspaceId: string | null;
  navigationSummary: WorkspaceNavigationSummary | null;
  notificationSummary: NotificationSummary;
};

export type AppBootstrapResponse = {
  user: User;
  workspaces: Array<{
    id: number;
    slug: string;
    name: string;
    projects: Array<{
      id: number;
      workspaceId: number;
      displayName: string;
      repositoryFullName: string | null;
      captureMode: WorkspaceProjectItem["captureMode"];
      createdAt: string;
      updatedAt: string;
    }>;
  }>;
  activeWorkspaceId: number | null;
  navigationSummary: WorkspaceNavigationSummary | null;
  notificationSummary: NotificationSummary;
};

export function mapAppBootstrap(response: AppBootstrapResponse): AppBootstrap {
  return {
    user: response.user,
    workspaces: response.workspaces.map((workspace) => ({
      id: String(workspace.id),
      slug: workspace.slug,
      name: workspace.name,
      projects: workspace.projects.map((project) => ({
        id: String(project.id),
        workspaceId: String(project.workspaceId),
        displayName: project.displayName,
        repositoryFullName: project.repositoryFullName,
        captureMode: project.captureMode,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })),
    })),
    activeWorkspaceId:
      response.activeWorkspaceId === null
        ? null
        : String(response.activeWorkspaceId),
    navigationSummary: response.navigationSummary,
    notificationSummary: response.notificationSummary,
  };
}
