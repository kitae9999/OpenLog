"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceView } from "@/widgets/workspace-dashboard/ui/WorkspaceView";
import { TasksListView } from "@/pages/tasks/ui/TasksListView";
import { LogsListView } from "@/pages/logs/ui/LogsListView";
import { TaskCreateView } from "@/pages/tasks/ui/TaskCreateView";
import { TaskDetailView } from "@/pages/tasks/ui/TaskDetailView";
import { TaskEditView } from "@/pages/tasks/ui/TaskEditView";
import { LogCreateView } from "@/pages/logs/ui/LogCreateView";
import { LogDetailView } from "@/pages/logs/ui/LogDetailView";
import { LogEditView } from "@/pages/logs/ui/LogEditView";
import type { LogListTypeFilter } from "@/entities/workspace/model/data";
import {
  buildWorkspaceUiData,
  fetchWorkspaceDashboard,
  fetchWorkspaceLog,
  fetchWorkspaceLogs,
  fetchWorkspaceTask,
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

export function WorkspaceTaskCreateQueryView() {
  const { bootstrap, activeWorkspaceId } = useWorkspaceApp();
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, {})
    : null;
  return (
    <WorkspaceRouteSection label="New task">
      <TaskCreateView isLoggedIn workspaceData={workspaceData} />
    </WorkspaceRouteSection>
  );
}

export function WorkspaceTaskQueryView({
  taskId,
  mode,
}: {
  taskId: string;
  mode: "detail" | "edit";
}) {
  const { bootstrap, activeWorkspaceId } = useWorkspaceApp();
  const task = useQuery({
    queryKey: workspaceQueryKeys.task(activeWorkspaceId ?? "none", taskId),
    queryFn: () => fetchWorkspaceTask(activeWorkspaceId!, taskId),
    enabled: activeWorkspaceId !== null,
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, {
        tasks: task.data ? [task.data] : [],
      })
    : null;
  return (
    <WorkspaceRouteSection label={mode === "edit" ? "Edit task" : "Task detail"}>
      <QueryState isLoading={task.isLoading} isError={task.isError}>
        {task.data && mode === "detail" ? (
          <TaskDetailView task={task.data} workspaceData={workspaceData} isLoggedIn />
        ) : null}
        {task.data && mode === "edit" ? (
          <TaskEditView task={task.data} workspaceId={activeWorkspaceId ?? undefined} />
        ) : null}
      </QueryState>
    </WorkspaceRouteSection>
  );
}

export function WorkspaceLogCreateQueryView({ taskId }: { taskId?: string }) {
  const { bootstrap, activeWorkspaceId } = useWorkspaceApp();
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, {})
    : null;
  return (
    <WorkspaceRouteSection label="New log">
      <LogCreateView
        isLoggedIn
        initialTaskId={taskId}
        workspaceData={workspaceData}
      />
    </WorkspaceRouteSection>
  );
}

export function WorkspaceLogQueryView({
  logId,
  mode,
}: {
  logId: string;
  mode: "detail" | "edit";
}) {
  const { bootstrap, activeWorkspaceId } = useWorkspaceApp();
  const log = useQuery({
    queryKey: workspaceQueryKeys.log(activeWorkspaceId ?? "none", logId),
    queryFn: () => fetchWorkspaceLog(activeWorkspaceId!, logId),
    enabled: activeWorkspaceId !== null,
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, {
        logs: log.data ? [log.data] : [],
      })
    : null;
  return (
    <WorkspaceRouteSection label={mode === "edit" ? "Edit log" : "Log detail"}>
      <QueryState isLoading={log.isLoading} isError={log.isError}>
        {log.data && mode === "detail" ? (
          <LogDetailView log={log.data} workspaceData={workspaceData} isLoggedIn />
        ) : null}
        {log.data && mode === "edit" ? (
          <LogEditView log={log.data} workspaceId={activeWorkspaceId ?? undefined} />
        ) : null}
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
