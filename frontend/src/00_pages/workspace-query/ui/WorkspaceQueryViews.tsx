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
import { PlannerView } from "@/pages/planner/ui/PlannerView";
import { ActivityView } from "@/pages/activity/ui/ActivityView";
import { OutputsListView } from "@/pages/outputs/ui/OutputsListView";
import { MemoryListView } from "@/pages/memory/ui/MemoryViews";
import { OutputCreateView } from "@/pages/outputs/ui/OutputCreateView";
import { OutputDetailView } from "@/pages/outputs/ui/OutputDetailView";
import {
  MemoryDetailView,
  MemoryEditorView,
} from "@/pages/memory/ui/MemoryViews";
import { WorkspaceGraphView } from "@/widgets/workspace-graph/ui/WorkspaceGraphView";
import { WorkspaceCreateView } from "@/pages/workspace-create/ui/WorkspaceCreateView";
import { ManageView } from "@/pages/workspace-manage/ui/ManageView";
import { WorkspaceAgentSettingsView } from "@/pages/workspace-agent/ui/WorkspaceAgentSettingsView";
import { parseAgentGuidePageLocale } from "@/pages/workspace-agent/model/agentGuidePageContent";
import type { LogListTypeFilter } from "@/entities/workspace/model/data";
import {
  buildWorkspaceUiData,
  fetchWorkspaceDashboard,
  fetchWorkspaceActivityView,
  fetchWorkspaceAgentSettings,
  fetchWorkspaceGraph,
  fetchWorkspaceLog,
  fetchWorkspaceLogs,
  fetchWorkspaceMemories,
  fetchWorkspaceMemory,
  fetchWorkspaceOutput,
  fetchWorkspaceOutputs,
  fetchWorkspacePlanner,
  fetchWorkspaceTask,
  fetchWorkspaceTasks,
  fetchWorkspaceTodos,
} from "@/entities/workspace/api/workspaceQueryApi";
import type { WorkspaceOutputStatus } from "@/entities/workspace/model/data";
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
  const logs = useQuery({
    queryKey: workspaceQueryKeys.logs(activeWorkspaceId ?? "none", "all"),
    queryFn: () => fetchWorkspaceLogs(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null,
    ...workspaceQueryPolicy,
  });
  const outputs = useQuery({
    queryKey: workspaceQueryKeys.outputs(activeWorkspaceId ?? "none", "all"),
    queryFn: () => fetchWorkspaceOutputs(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null,
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, {
        tasks: tasks.data ?? [],
        logs: logs.data ?? [],
        outputs: outputs.data ?? [],
      })
    : null;

  return (
    <WorkspaceRouteSection label="Tasks">
      <QueryState
        isLoading={tasks.isLoading || logs.isLoading || outputs.isLoading}
        isError={tasks.isError || logs.isError || outputs.isError}
      >
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
  const tasks = useQuery({
    queryKey: workspaceQueryKeys.tasks(activeWorkspaceId ?? "none", "all"),
    queryFn: () => fetchWorkspaceTasks(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null,
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, {
        logs: logs.data ?? [],
        tasks: tasks.data ?? [],
      })
    : null;

  return (
    <WorkspaceRouteSection label="Logs">
      <QueryState
        isLoading={logs.isLoading || tasks.isLoading}
        isError={logs.isError || tasks.isError}
      >
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
  const logs = useQuery({
    queryKey: workspaceQueryKeys.logs(activeWorkspaceId ?? "none", "all"),
    queryFn: () => fetchWorkspaceLogs(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null && mode === "detail",
    ...workspaceQueryPolicy,
  });
  const outputs = useQuery({
    queryKey: workspaceQueryKeys.outputs(activeWorkspaceId ?? "none", "all"),
    queryFn: () => fetchWorkspaceOutputs(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null && mode === "detail",
    ...workspaceQueryPolicy,
  });
  const todos = useQuery({
    queryKey: workspaceQueryKeys.todos(activeWorkspaceId ?? "none"),
    queryFn: () => fetchWorkspaceTodos(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null && mode === "detail",
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, {
        tasks: task.data ? [task.data] : [],
        logs: logs.data ?? [],
        outputs: outputs.data ?? [],
        todos: todos.data ?? [],
      })
    : null;
  return (
    <WorkspaceRouteSection
      label={mode === "edit" ? "Edit task" : "Task detail"}
    >
      <QueryState
        isLoading={
          task.isLoading ||
          (mode === "detail" &&
            (logs.isLoading || outputs.isLoading || todos.isLoading))
        }
        isError={
          task.isError ||
          (mode === "detail" &&
            (logs.isError || outputs.isError || todos.isError))
        }
      >
        {task.data && mode === "detail" ? (
          <TaskDetailView
            task={task.data}
            workspaceData={workspaceData}
            isLoggedIn
          />
        ) : null}
        {task.data && mode === "edit" ? (
          <TaskEditView
            task={task.data}
            workspaceId={activeWorkspaceId ?? undefined}
          />
        ) : null}
      </QueryState>
    </WorkspaceRouteSection>
  );
}

export function WorkspaceLogCreateQueryView({ taskId }: { taskId?: string }) {
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
    <WorkspaceRouteSection label="New log">
      <QueryState isLoading={tasks.isLoading} isError={tasks.isError}>
        <LogCreateView
          isLoggedIn
          initialTaskId={taskId}
          workspaceData={workspaceData}
        />
      </QueryState>
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
  const tasks = useQuery({
    queryKey: workspaceQueryKeys.tasks(activeWorkspaceId ?? "none", "all"),
    queryFn: () => fetchWorkspaceTasks(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null && mode === "detail",
    ...workspaceQueryPolicy,
  });
  const outputs = useQuery({
    queryKey: workspaceQueryKeys.outputs(activeWorkspaceId ?? "none", "all"),
    queryFn: () => fetchWorkspaceOutputs(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null && mode === "detail",
    ...workspaceQueryPolicy,
  });
  const memories = useQuery({
    queryKey: workspaceQueryKeys.memories(activeWorkspaceId ?? "none"),
    queryFn: () => fetchWorkspaceMemories(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null && mode === "detail",
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, {
        logs: log.data ? [log.data] : [],
        tasks: tasks.data ?? [],
        outputs: outputs.data ?? [],
        memories: memories.data ?? [],
      })
    : null;
  return (
    <WorkspaceRouteSection label={mode === "edit" ? "Edit log" : "Log detail"}>
      <QueryState
        isLoading={
          log.isLoading ||
          (mode === "detail" &&
            (tasks.isLoading || outputs.isLoading || memories.isLoading))
        }
        isError={
          log.isError ||
          (mode === "detail" &&
            (tasks.isError || outputs.isError || memories.isError))
        }
      >
        {log.data && mode === "detail" ? (
          <LogDetailView
            log={log.data}
            workspaceData={workspaceData}
            isLoggedIn
          />
        ) : null}
        {log.data && mode === "edit" ? (
          <LogEditView
            log={log.data}
            workspaceId={activeWorkspaceId ?? undefined}
          />
        ) : null}
      </QueryState>
    </WorkspaceRouteSection>
  );
}

export function WorkspacePlannerQueryView({
  requestedMonth,
  requestedDate,
}: {
  requestedMonth?: string;
  requestedDate?: string;
}) {
  const { bootstrap, activeWorkspaceId } = useWorkspaceApp();
  const today = getSeoulIsoDate(new Date());
  const month = isValidMonth(requestedMonth)
    ? requestedMonth
    : today.slice(0, 7);
  const { from, to } = getMonthRange(month);
  const selectedDate =
    isValidDate(requestedDate) && requestedDate.startsWith(`${month}-`)
      ? requestedDate
      : today.startsWith(`${month}-`)
        ? today
        : from;
  const planner = useQuery({
    queryKey: workspaceQueryKeys.planner(activeWorkspaceId ?? "none", month),
    queryFn: () => fetchWorkspacePlanner(activeWorkspaceId!, from, to),
    enabled: activeWorkspaceId !== null,
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, {
        tasks: planner.data?.tasks ?? [],
        todos: planner.data?.todos ?? [],
      })
    : null;
  return (
    <WorkspaceRouteSection label="Planner">
      <QueryState isLoading={planner.isLoading} isError={planner.isError}>
        {workspaceData ? (
          <PlannerView
            month={month}
            selectedDate={selectedDate}
            todos={planner.data?.todos ?? []}
            workspaceData={workspaceData}
          />
        ) : null}
      </QueryState>
    </WorkspaceRouteSection>
  );
}

export function WorkspaceGraphQueryView() {
  const { bootstrap, activeWorkspaceId } = useWorkspaceApp();
  const graph = useQuery({
    queryKey: workspaceQueryKeys.graph(activeWorkspaceId ?? "none"),
    queryFn: () => fetchWorkspaceGraph(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null,
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, graph.data ?? {})
    : null;
  return (
    <WorkspaceRouteSection label="Workspace Graph">
      <QueryState isLoading={graph.isLoading} isError={graph.isError}>
        <WorkspaceGraphView isLoggedIn workspaceData={workspaceData} />
      </QueryState>
    </WorkspaceRouteSection>
  );
}

export function WorkspaceOutputsQueryView({
  status,
}: {
  status: WorkspaceOutputStatus;
}) {
  const { bootstrap, activeWorkspaceId } = useWorkspaceApp();
  const outputs = useQuery({
    queryKey: workspaceQueryKeys.outputs(activeWorkspaceId ?? "none", "all"),
    queryFn: () => fetchWorkspaceOutputs(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null,
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, {
        outputs: outputs.data ?? [],
      })
    : null;
  return (
    <WorkspaceRouteSection label="Outputs">
      <QueryState isLoading={outputs.isLoading} isError={outputs.isError}>
        <OutputsListView
          isLoggedIn
          status={status}
          workspaceData={workspaceData}
        />
      </QueryState>
    </WorkspaceRouteSection>
  );
}

export function WorkspaceMemoryQueryView() {
  const { bootstrap, activeWorkspaceId } = useWorkspaceApp();
  const memories = useQuery({
    queryKey: workspaceQueryKeys.memories(activeWorkspaceId ?? "none"),
    queryFn: () => fetchWorkspaceMemories(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null,
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, {
        memories: memories.data ?? [],
      })
    : null;
  return (
    <WorkspaceRouteSection label="Memory">
      <QueryState isLoading={memories.isLoading} isError={memories.isError}>
        <MemoryListView workspaceData={workspaceData} />
      </QueryState>
    </WorkspaceRouteSection>
  );
}

export function WorkspaceActivityQueryView({
  requestedDate,
}: {
  requestedDate?: string;
}) {
  const { activeWorkspaceId } = useWorkspaceApp();
  const today = getSeoulIsoDate(new Date());
  const from = getSeoulIsoDate(
    new Date(new Date(`${today}T00:00:00Z`).getTime() - 364 * 86_400_000),
  );
  const selectedDate =
    isValidDate(requestedDate) &&
    requestedDate >= from &&
    requestedDate <= today
      ? requestedDate
      : today;
  const activity = useQuery({
    queryKey: workspaceQueryKeys.activity(
      activeWorkspaceId ?? "none",
      `${from}:${today}`,
      selectedDate,
    ),
    queryFn: () =>
      fetchWorkspaceActivityView(activeWorkspaceId!, from, today, selectedDate),
    enabled: activeWorkspaceId !== null,
    ...workspaceQueryPolicy,
  });
  return (
    <WorkspaceRouteSection label="Activity">
      <QueryState isLoading={activity.isLoading} isError={activity.isError}>
        <ActivityView
          activity={activity.data?.activity ?? null}
          selectedDate={selectedDate}
          selectedLogs={activity.data?.logs ?? []}
        />
      </QueryState>
    </WorkspaceRouteSection>
  );
}

export function WorkspaceCreateQueryView() {
  return (
    <WorkspaceRouteSection label="New workspace">
      <WorkspaceCreateView isLoggedIn />
    </WorkspaceRouteSection>
  );
}

export function WorkspaceManageQueryView() {
  const { bootstrap } = useWorkspaceApp();
  return (
    <WorkspaceRouteSection label="Manage workspaces">
      <ManageView isLoggedIn workspaces={bootstrap.workspaces} />
    </WorkspaceRouteSection>
  );
}

export function WorkspaceOutputCreateQueryView({
  taskId,
}: {
  taskId?: string;
}) {
  const { bootstrap, activeWorkspaceId } = useWorkspaceApp();
  const graph = useQuery({
    queryKey: workspaceQueryKeys.graph(activeWorkspaceId ?? "none"),
    queryFn: () => fetchWorkspaceGraph(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null,
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, graph.data ?? {})
    : null;
  return (
    <WorkspaceRouteSection label="New output">
      <QueryState isLoading={graph.isLoading} isError={graph.isError}>
        <OutputCreateView
          isLoggedIn
          initialTaskId={taskId}
          workspaceData={workspaceData}
        />
      </QueryState>
    </WorkspaceRouteSection>
  );
}

export function WorkspaceOutputQueryView({ outputId }: { outputId: string }) {
  const { bootstrap, activeWorkspaceId } = useWorkspaceApp();
  const output = useQuery({
    queryKey: workspaceQueryKeys.output(activeWorkspaceId ?? "none", outputId),
    queryFn: () => fetchWorkspaceOutput(activeWorkspaceId!, outputId),
    enabled: activeWorkspaceId !== null,
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, {
        outputs: output.data ? [output.data] : [],
      })
    : null;
  return (
    <WorkspaceRouteSection label="Output detail">
      <QueryState isLoading={output.isLoading} isError={output.isError}>
        <OutputDetailView
          isLoggedIn
          outputId={outputId}
          output={output.data}
          workspaceData={workspaceData}
        />
      </QueryState>
    </WorkspaceRouteSection>
  );
}

export function WorkspaceMemoryEditorQueryView({
  memoryId,
  mode,
}: {
  memoryId?: string;
  mode: "new" | "detail" | "edit";
}) {
  const { bootstrap, activeWorkspaceId } = useWorkspaceApp();
  const memory = useQuery({
    queryKey: workspaceQueryKeys.memory(
      activeWorkspaceId ?? "none",
      memoryId ?? "new",
    ),
    queryFn: () => fetchWorkspaceMemory(activeWorkspaceId!, memoryId!),
    enabled: activeWorkspaceId !== null && memoryId !== undefined,
    ...workspaceQueryPolicy,
  });
  const tasks = useQuery({
    queryKey: workspaceQueryKeys.tasks(activeWorkspaceId ?? "none", "all"),
    queryFn: () => fetchWorkspaceTasks(activeWorkspaceId!),
    enabled: activeWorkspaceId !== null && mode !== "detail",
    ...workspaceQueryPolicy,
  });
  const workspaceData = activeWorkspaceId
    ? buildWorkspaceUiData(bootstrap, activeWorkspaceId, {
        memories: memory.data ? [memory.data] : [],
        tasks: tasks.data ?? [],
      })
    : null;
  return (
    <WorkspaceRouteSection label="Memory">
      <QueryState
        isLoading={
          (memoryId !== undefined && memory.isLoading) ||
          (mode !== "detail" && tasks.isLoading)
        }
        isError={memory.isError || (mode !== "detail" && tasks.isError)}
      >
        {workspaceData && mode === "new" ? (
          <MemoryEditorView workspaceData={workspaceData} />
        ) : null}
        {workspaceData && memory.data && mode === "detail" ? (
          <MemoryDetailView
            memory={memory.data}
            workspaceData={workspaceData}
          />
        ) : null}
        {workspaceData && memory.data && mode === "edit" ? (
          <MemoryEditorView
            memory={memory.data}
            workspaceData={workspaceData}
          />
        ) : null}
      </QueryState>
    </WorkspaceRouteSection>
  );
}

export function WorkspaceAgentSettingsQueryView({
  workspaceId,
  locale,
}: {
  workspaceId: string;
  locale?: string | null;
}) {
  const { bootstrap } = useWorkspaceApp();
  const settings = useQuery({
    queryKey: ["workspace", workspaceId, "agent"],
    queryFn: () =>
      fetchWorkspaceAgentSettings(bootstrap.workspaces, workspaceId),
    ...workspaceQueryPolicy,
  });
  return (
    <WorkspaceRouteSection label="Agent settings">
      <QueryState isLoading={settings.isLoading} isError={settings.isError}>
        {settings.data ? (
          <WorkspaceAgentSettingsView
            data={settings.data}
            locale={parseAgentGuidePageLocale(locale)}
          />
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

function isValidMonth(value?: string): value is string {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return false;
  const [year, month] = value.split("-").map(Number);
  return year >= 1970 && month >= 1 && month <= 12;
}

function isValidDate(value?: string): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function getMonthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function getSeoulIsoDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
