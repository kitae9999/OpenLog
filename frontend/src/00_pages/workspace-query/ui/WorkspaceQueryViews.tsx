"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceView } from "@/widgets/workspace-dashboard/ui/WorkspaceView";
import { TasksListView } from "@/pages/tasks/ui/TasksListView";
import { LogsListView } from "@/pages/logs/ui/LogsListView";
import type { LogListTypeFilter } from "@/entities/workspace/model/data";
import {
  buildWorkspaceUiData,
  fetchWorkspaceDashboard,
  fetchWorkspaceLogs,
  fetchWorkspaceTasks,
} from "@/entities/workspace/api/workspaceQueryApi";
import { useWorkspaceApp } from "@/features/app-session/model/WorkspaceAppContext";
import { workspaceQueryKeys } from "@/shared/api/queryKeys";

const workspaceQueryPolicy = {
  staleTime: 30_000,
  refetchOnWindowFocus: false,
} as const;

export function WorkspaceDashboardQueryView() {
  const { bootstrap, activeWorkspaceId } = useWorkspaceApp();
  const dashboard = useQuery({
    queryKey: workspaceQueryKeys.dashboard(activeWorkspaceId ?? "none"),
    queryFn: () => fetchWorkspaceDashboard(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null,
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, dashboard.data ?? {})
    : null;

  return (
    <WorkspaceRouteSection label="Workspace">
      <QueryState isLoading={dashboard.isLoading} isError={dashboard.isError}>
        <WorkspaceView
          isLoggedIn
          workspaceData={workspaceData}
          activity={workspaceData?.activity}
        />
      </QueryState>
    </WorkspaceRouteSection>
  );
}

export function WorkspaceTasksQueryView() {
  const { bootstrap, activeWorkspaceId } = useWorkspaceApp();
  const tasks = useQuery({
    queryKey: workspaceQueryKeys.tasks(activeWorkspaceId ?? "none", "all"),
    queryFn: () => fetchWorkspaceTasks(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null,
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, {
        tasks: tasks.data ?? [],
      })
    : null;

  return (
    <WorkspaceRouteSection label="Tasks">
      <QueryState isLoading={tasks.isLoading} isError={tasks.isError}>
        <TasksListView isLoggedIn workspaceData={workspaceData} />
      </QueryState>
    </WorkspaceRouteSection>
  );
}

export function WorkspaceLogsQueryView({
  typeFilter = "all",
}: {
  typeFilter?: LogListTypeFilter;
}) {
  const { bootstrap, activeWorkspaceId } = useWorkspaceApp();
  const logs = useQuery({
    queryKey: workspaceQueryKeys.logs(activeWorkspaceId ?? "none", "all"),
    queryFn: () => fetchWorkspaceLogs(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null,
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, {
        logs: logs.data ?? [],
      })
    : null;

  return (
    <WorkspaceRouteSection label="Logs">
      <QueryState isLoading={logs.isLoading} isError={logs.isError}>
        <Suspense fallback={null}>
          <LogsListView
            isLoggedIn
            typeFilter={typeFilter}
            workspaceData={workspaceData}
          />
        </Suspense>
      </QueryState>
    </WorkspaceRouteSection>
  );
}

function WorkspaceRouteSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 xl:px-10"
    >
      {children}
    </section>
  );
}

function QueryState({
  isLoading,
  isError,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return <p className="py-12 text-sm text-zinc-500">Loading workspace…</p>;
  }
  if (isError) {
    return (
      <p role="alert" className="py-12 text-sm text-red-600">
        Failed to load workspace data.
      </p>
    );
  }
  return children;
}
