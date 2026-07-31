import type { Query, QueryClient } from "@tanstack/react-query";
import type {
  WorkspaceLogItem,
  WorkspaceTaskOutput,
  WorkspaceTodoItem,
  WorkspaceWorkItem,
} from "@/entities/workspace/model/data";
import type {
  WorkspaceActivity,
  WorkspaceMemoryItem,
  WorkspaceUiData,
} from "@/entities/workspace/model/workspaceTypes";
import {
  fetchWorkspaceDashboard,
  fetchWorkspaceDashboardRefresh,
  fetchWorkspaceMemories,
  fetchWorkspaceMemory,
  fetchWorkspaceOutput,
  fetchWorkspaceOutputs,
  fetchWorkspaceTodos,
  fetchWorkspaceWorkingBrief,
} from "@/entities/workspace/api/workspaceQueryApi";
import { workspaceQueryKeys } from "@/shared/api/queryKeys";

export type WorkspaceChangedPayload = {
  workspaceId: number;
  zone: string;
  entityType: string;
  entityId: string;
  action: string;
  occurredAt: string;
};

type SupportedZone =
  | "tasks"
  | "logs"
  | "todos"
  | "outputs"
  | "memories"
  | "brief";

const SUPPORTED_ZONES = new Set<SupportedZone>([
  "tasks",
  "logs",
  "todos",
  "outputs",
  "memories",
  "brief",
]);

const DASHBOARD_LIMITS = {
  logs: 6,
  outputs: 1,
  memories: 8,
} as const;

/**
 * Keep the cold-read and incremental-read boundaries separate:
 * one entity -> detail read, one busy zone -> list read, uncertain or cross-zone
 * changes -> the bounded dashboard snapshot used as the recovery boundary.
 */
export async function refreshWorkspaceChangeBatch({
  queryClient,
  workspaceId,
  events,
}: {
  queryClient: QueryClient;
  workspaceId: string;
  events: WorkspaceChangedPayload[];
}) {
  if (events.length === 0) return;

  const zones = new Set(
    events.map((event) => normalizeZone(event.zone || event.entityType)),
  );
  const supportedZones = [...zones].filter(isSupportedZone);
  const needsSnapshotRecovery =
    supportedZones.length !== zones.size ||
    supportedZones.length !== 1 ||
    events.some(requiresSnapshotForDelete);

  if (needsSnapshotRecovery) {
    const recoveryZones =
      supportedZones.length === zones.size ? supportedZones : SUPPORTED_ZONES;
    await recoverWorkspaceSnapshot(queryClient, workspaceId, recoveryZones);
    return;
  }

  const zone = supportedZones[0];
  try {
    if (zone === "tasks" || zone === "logs") {
      await refreshDashboardProjection(
        queryClient,
        workspaceId,
        zone,
        events.map((event) => event.entityId),
      );
    } else if (events.length === 1 && canRefreshSingleEntity(zone, events[0])) {
      await refreshSingleEntity(queryClient, workspaceId, zone, events[0]);
    } else {
      await refreshZoneList(queryClient, workspaceId, zone);
    }
  } catch {
    await recoverWorkspaceSnapshot(queryClient, workspaceId, [zone]);
  }
}

export async function recoverWorkspaceAfterReconnect({
  queryClient,
  workspaceId,
}: {
  queryClient: QueryClient;
  workspaceId: string;
}) {
  await recoverWorkspaceSnapshot(queryClient, workspaceId, [
    "tasks",
    "logs",
    "todos",
    "outputs",
    "memories",
    "brief",
  ]);
}

async function refreshDashboardProjection(
  queryClient: QueryClient,
  workspaceId: string,
  zone: "tasks" | "logs",
  entityIds: string[],
) {
  const distinctEntityIds = [...new Set(entityIds.filter((id) => id.trim()))];
  if (distinctEntityIds.length === 0) {
    throw new Error("Dashboard refresh requires at least one entity id.");
  }

  const refresh = await fetchWorkspaceDashboardRefresh(
    workspaceId,
    zone,
    distinctEntityIds,
  );
  queryClient.setQueryData(
    workspaceQueryKeys.navigation(workspaceId),
    refresh.navigationSummary,
  );

  if (refresh.zone === "tasks") {
    const tasks =
      refresh.mode === "PATCH"
        ? [requireRefreshEntity(refresh.task, "task")]
        : refresh.tasks;

    if (refresh.mode === "PATCH") {
      const task = tasks[0];
      setEntityDetail(
        queryClient,
        workspaceQueryKeys.task(workspaceId, task.id),
        task,
      );
      updateListQueries<WorkspaceWorkItem>(
        queryClient,
        workspaceId,
        "tasks",
        (items) => upsertRecent(items, task),
      );
    } else {
      replaceListQueries(queryClient, workspaceId, "tasks", tasks);
    }

    patchDashboard(queryClient, workspaceId, (dashboard) => ({
      ...dashboard,
      tasks:
        refresh.mode === "REPLACE"
          ? tasks
          : mergeRecent(dashboard.tasks ?? [], tasks),
      navigationSummary: refresh.navigationSummary,
    }));
    patchGraph(queryClient, workspaceId, (graph) => ({
      ...graph,
      tasks: mergeRecent(graph.tasks ?? [], tasks),
    }));
    patchPlanner(queryClient, workspaceId, (planner) => ({
      ...planner,
      tasks: mergeRecent(planner.tasks, tasks),
    }));
    return;
  }

  const activity = requireRefreshEntity(refresh.activity, "activity");
  const logs =
    refresh.mode === "PATCH"
      ? [requireRefreshEntity(refresh.log, "log")]
      : refresh.logs;
  const tasks =
    refresh.mode === "PATCH"
      ? refresh.linkedTask
        ? [refresh.linkedTask]
        : []
      : refresh.tasks;

  if (refresh.mode === "PATCH") {
    const log = logs[0];
    setEntityDetail(
      queryClient,
      workspaceQueryKeys.log(workspaceId, log.id),
      log,
    );
    updateListQueries<WorkspaceLogItem>(
      queryClient,
      workspaceId,
      "logs",
      (items) => upsertRecent(items, log),
    );
    for (const task of tasks) {
      setEntityDetail(
        queryClient,
        workspaceQueryKeys.task(workspaceId, task.id),
        task,
      );
      updateListQueries<WorkspaceWorkItem>(
        queryClient,
        workspaceId,
        "tasks",
        (items) => upsertRecent(items, task),
      );
    }
  } else {
    replaceListQueries(queryClient, workspaceId, "logs", logs);
    replaceListQueries(queryClient, workspaceId, "tasks", tasks);
  }

  patchDashboard(queryClient, workspaceId, (dashboard) => ({
    ...dashboard,
    logs:
      refresh.mode === "REPLACE"
        ? logs.slice(0, DASHBOARD_LIMITS.logs)
        : mergeRecent(dashboard.logs ?? [], logs, DASHBOARD_LIMITS.logs),
    tasks:
      refresh.mode === "REPLACE"
        ? tasks
        : mergeRecent(dashboard.tasks ?? [], tasks),
    activity,
    navigationSummary: refresh.navigationSummary,
  }));
  patchGraph(queryClient, workspaceId, (graph) => ({
    ...graph,
    logs: mergeRecent(graph.logs ?? [], logs),
    tasks: mergeRecent(graph.tasks ?? [], tasks),
  }));
  patchPlanner(queryClient, workspaceId, (planner) => ({
    ...planner,
    tasks: mergeRecent(planner.tasks, tasks),
  }));
  patchActivityQueries(queryClient, workspaceId, activity, logs);
}

async function refreshSingleEntity(
  queryClient: QueryClient,
  workspaceId: string,
  zone: SupportedZone,
  event: WorkspaceChangedPayload,
) {
  if (zone === "outputs") {
    const output = await fetchWorkspaceOutput(workspaceId, event.entityId);
    setEntityDetail(
      queryClient,
      workspaceQueryKeys.output(workspaceId, output.id),
      output,
    );
    updateListQueries<WorkspaceTaskOutput>(
      queryClient,
      workspaceId,
      "outputs",
      (items) => upsertRecent(items, output),
    );
    patchDashboard(queryClient, workspaceId, (dashboard) => ({
      ...dashboard,
      outputs: upsertRecent(
        dashboard.outputs ?? [],
        output,
        DASHBOARD_LIMITS.outputs,
      ),
    }));
    patchGraph(queryClient, workspaceId, (graph) => ({
      ...graph,
      outputs: upsertRecent(graph.outputs ?? [], output),
    }));
    return;
  }

  if (zone === "memories") {
    const memory = await fetchWorkspaceMemory(workspaceId, event.entityId);
    setEntityDetail(
      queryClient,
      workspaceQueryKeys.memory(workspaceId, memory.id),
      memory,
    );
    updateListQueries<WorkspaceMemoryItem>(
      queryClient,
      workspaceId,
      "memories",
      (items) => upsertRecent(items, memory),
    );
    patchDashboard(queryClient, workspaceId, (dashboard) => ({
      ...dashboard,
      memories: upsertRecent(
        dashboard.memories ?? [],
        memory,
        DASHBOARD_LIMITS.memories,
      ),
    }));
    patchGraph(queryClient, workspaceId, (graph) => ({
      ...graph,
      memories: upsertRecent(graph.memories ?? [], memory),
    }));
    return;
  }

  await refreshZoneList(queryClient, workspaceId, zone);
}

async function refreshZoneList(
  queryClient: QueryClient,
  workspaceId: string,
  zone: SupportedZone,
) {
  if (zone === "todos") {
    const todos = await fetchWorkspaceTodos(workspaceId);
    queryClient.setQueryData(workspaceQueryKeys.todos(workspaceId), todos);
    patchDashboard(queryClient, workspaceId, (dashboard) => ({
      ...dashboard,
      todos: todos.filter((todo) => todo.plannedFor === getSeoulToday()),
    }));
    replacePlannerTodos(queryClient, workspaceId, todos);
    return;
  }

  if (zone === "outputs") {
    const outputs = await fetchWorkspaceOutputs(workspaceId);
    replaceListQueries(queryClient, workspaceId, "outputs", outputs);
    patchDashboard(queryClient, workspaceId, (dashboard) => ({
      ...dashboard,
      outputs: outputs.slice(0, DASHBOARD_LIMITS.outputs),
    }));
    patchGraph(queryClient, workspaceId, (graph) => ({
      ...graph,
      outputs: mergeRecent(graph.outputs ?? [], outputs),
    }));
    return;
  }

  if (zone === "memories") {
    const memories = await fetchWorkspaceMemories(workspaceId);
    replaceListQueries(queryClient, workspaceId, "memories", memories);
    patchDashboard(queryClient, workspaceId, (dashboard) => ({
      ...dashboard,
      memories: memories.slice(0, DASHBOARD_LIMITS.memories),
    }));
    patchGraph(queryClient, workspaceId, (graph) => ({
      ...graph,
      memories: mergeRecent(graph.memories ?? [], memories),
    }));
    return;
  }

  const workingBrief = await fetchWorkspaceWorkingBrief(workspaceId);
  patchDashboard(queryClient, workspaceId, (dashboard) => ({
    ...dashboard,
    workingBrief,
  }));
}

async function recoverWorkspaceSnapshot(
  queryClient: QueryClient,
  workspaceId: string,
  zones: Iterable<SupportedZone>,
) {
  const dashboard = await queryClient.fetchQuery({
    queryKey: workspaceQueryKeys.dashboard(workspaceId),
    queryFn: () => fetchWorkspaceDashboard(workspaceId),
    staleTime: 0,
  });
  queryClient.setQueryData(
    workspaceQueryKeys.dashboard(workspaceId),
    dashboard,
  );
  if (dashboard.navigationSummary) {
    queryClient.setQueryData(
      workspaceQueryKeys.navigation(workspaceId),
      dashboard.navigationSummary,
    );
  }
  await invalidateDerivedQueries(
    queryClient,
    workspaceId,
    new Set(zones),
    true,
  );
}

async function invalidateDerivedQueries(
  queryClient: QueryClient,
  workspaceId: string,
  zones: Set<SupportedZone>,
  includePrimaryLists = false,
) {
  const resources = new Set<string>();
  if (zones.has("tasks")) {
    resources.add("graph");
    resources.add("planner");
    if (includePrimaryLists) {
      resources.add("tasks");
      resources.add("task");
    }
  }
  if (zones.has("logs")) {
    resources.add("graph");
    resources.add("activity");
    if (includePrimaryLists) {
      resources.add("logs");
      resources.add("log");
    }
  }
  if (zones.has("todos")) {
    resources.add("todos");
    resources.add("planner");
  }
  if (zones.has("outputs")) {
    resources.add("graph");
    if (includePrimaryLists) {
      resources.add("outputs");
      resources.add("output");
    }
  }
  if (zones.has("memories")) {
    resources.add("graph");
    if (includePrimaryLists) {
      resources.add("memories");
      resources.add("memory");
    }
  }
  if (resources.size === 0) return;

  await queryClient.invalidateQueries({
    predicate: (query) =>
      belongsToWorkspaceResource(query, workspaceId, resources),
    refetchType: "active",
  });
}

function patchDashboard(
  queryClient: QueryClient,
  workspaceId: string,
  updater: (dashboard: Partial<WorkspaceUiData>) => Partial<WorkspaceUiData>,
) {
  queryClient.setQueryData<Partial<WorkspaceUiData>>(
    workspaceQueryKeys.dashboard(workspaceId),
    (dashboard) => (dashboard ? updater(dashboard) : dashboard),
  );
}

function patchGraph(
  queryClient: QueryClient,
  workspaceId: string,
  updater: (graph: Partial<WorkspaceUiData>) => Partial<WorkspaceUiData>,
) {
  queryClient.setQueriesData<Partial<WorkspaceUiData>>(
    {
      predicate: (query) =>
        belongsToWorkspaceResource(query, workspaceId, new Set(["graph"])),
    },
    (graph) => (graph ? updater(graph) : graph),
  );
}

type WorkspacePlannerProjection = {
  tasks: WorkspaceWorkItem[];
  todos: WorkspaceTodoItem[];
};

function patchPlanner(
  queryClient: QueryClient,
  workspaceId: string,
  updater: (planner: WorkspacePlannerProjection) => WorkspacePlannerProjection,
) {
  queryClient.setQueriesData<WorkspacePlannerProjection>(
    {
      predicate: (query) =>
        belongsToWorkspaceResource(query, workspaceId, new Set(["planner"])),
    },
    (planner) => (planner ? updater(planner) : planner),
  );
}

function replacePlannerTodos(
  queryClient: QueryClient,
  workspaceId: string,
  todos: WorkspaceTodoItem[],
) {
  const queries = queryClient.getQueryCache().findAll({
    predicate: (query) =>
      belongsToWorkspaceResource(query, workspaceId, new Set(["planner"])),
  });
  for (const query of queries) {
    const month = String(query.queryKey[3] ?? "");
    queryClient.setQueryData<WorkspacePlannerProjection>(
      query.queryKey,
      (planner) =>
        planner
          ? {
              ...planner,
              todos: todos.filter((todo) =>
                todo.plannedFor?.startsWith(`${month}-`),
              ),
            }
          : planner,
    );
  }
}

type WorkspaceActivityProjection = {
  activity: WorkspaceActivity;
  logs: WorkspaceLogItem[];
};

function patchActivityQueries(
  queryClient: QueryClient,
  workspaceId: string,
  activity: WorkspaceActivity,
  logs: WorkspaceLogItem[],
) {
  const range = `${activity.from}:${activity.to}`;
  const queries = queryClient.getQueryCache().findAll({
    predicate: (query) =>
      belongsToWorkspaceResource(query, workspaceId, new Set(["activity"])) &&
      query.queryKey[3] === range,
  });
  for (const query of queries) {
    const selectedDate = String(query.queryKey[4] ?? "");
    const selectedLogs = logs.filter(
      (log) => log.createdAt?.slice(0, 10) === selectedDate,
    );
    queryClient.setQueryData<WorkspaceActivityProjection>(
      query.queryKey,
      (current) =>
        current
          ? {
              activity,
              logs: mergeRecent(current.logs, selectedLogs),
            }
          : current,
    );
  }
}

function setEntityDetail<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  value: T,
) {
  queryClient.setQueryData(queryKey, value);
}

function updateListQueries<T>(
  queryClient: QueryClient,
  workspaceId: string,
  resource: string,
  updater: (items: T[]) => T[],
) {
  queryClient.setQueriesData<T[]>(
    {
      predicate: (query) =>
        belongsToWorkspaceResource(query, workspaceId, new Set([resource])),
    },
    (items) => (items ? updater(items) : items),
  );
}

function replaceListQueries<T>(
  queryClient: QueryClient,
  workspaceId: string,
  resource: string,
  items: T[],
) {
  updateListQueries<T>(queryClient, workspaceId, resource, () => items);
}

function belongsToWorkspaceResource(
  query: Query,
  workspaceId: string,
  resources: Set<string>,
) {
  return (
    query.queryKey[0] === "workspace" &&
    query.queryKey[1] === workspaceId &&
    resources.has(String(query.queryKey[2]))
  );
}

function upsertRecent<T extends { id: string; updatedAt?: string }>(
  items: T[],
  incoming: T,
  limit?: number,
) {
  const next = [incoming, ...items.filter((item) => item.id !== incoming.id)];
  next.sort((left, right) => {
    const byUpdatedAt = (right.updatedAt ?? "").localeCompare(
      left.updatedAt ?? "",
    );
    if (byUpdatedAt !== 0) return byUpdatedAt;
    return right.id.localeCompare(left.id, undefined, { numeric: true });
  });
  return limit === undefined ? next : next.slice(0, limit);
}

function mergeRecent<T extends { id: string; updatedAt?: string }>(
  current: T[],
  incoming: T[],
  limit?: number,
) {
  return incoming.reduce(
    (items, item) => upsertRecent(items, item, limit),
    current,
  );
}

function requireRefreshEntity<T>(value: T | null, entityName: string): T {
  if (value === null) {
    throw new Error(`Dashboard refresh response is missing ${entityName}.`);
  }
  return value;
}

function getSeoulToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function requiresSnapshotForDelete(event: WorkspaceChangedPayload) {
  const zone = normalizeZone(event.zone || event.entityType);
  return (
    event.action.trim().toUpperCase() === "DELETED" &&
    zone !== "todos" &&
    zone !== "brief"
  );
}

function canRefreshSingleEntity(
  zone: SupportedZone,
  event: WorkspaceChangedPayload,
) {
  const action = event.action.trim().toUpperCase();
  return (
    event.entityId.trim().length > 0 &&
    (action === "CREATED" || action === "UPDATED") &&
    zone !== "todos" &&
    zone !== "brief"
  );
}

function isSupportedZone(zone: string): zone is SupportedZone {
  return SUPPORTED_ZONES.has(zone as SupportedZone);
}

export function normalizeZone(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("task")) return "tasks";
  if (normalized.includes("log")) return "logs";
  if (normalized.includes("todo")) return "todos";
  if (normalized.includes("output")) return "outputs";
  if (normalized.includes("memor")) return "memories";
  if (normalized.includes("brief")) return "brief";
  return normalized;
}
