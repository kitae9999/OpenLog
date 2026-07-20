export const appQueryKeys = {
  session: ["session"] as const,
  workspaces: ["workspaces"] as const,
  notificationSummary: ["notifications", "summary"] as const,
  notificationList: ["notifications", "list"] as const,
};

export const workspaceQueryKeys = {
  root: (workspaceId: string) => ["workspace", workspaceId] as const,
  navigation: (workspaceId: string) =>
    ["workspace", workspaceId, "navigation"] as const,
  dashboard: (workspaceId: string) =>
    ["workspace", workspaceId, "dashboard"] as const,
  tasks: (workspaceId: string, filters: string = "all") =>
    ["workspace", workspaceId, "tasks", filters] as const,
  task: (workspaceId: string, taskId: string) =>
    ["workspace", workspaceId, "task", taskId] as const,
  logs: (workspaceId: string, filters: string = "all") =>
    ["workspace", workspaceId, "logs", filters] as const,
  log: (workspaceId: string, logId: string) =>
    ["workspace", workspaceId, "log", logId] as const,
  planner: (workspaceId: string, month: string) =>
    ["workspace", workspaceId, "planner", month] as const,
  graph: (workspaceId: string) =>
    ["workspace", workspaceId, "graph"] as const,
  outputs: (workspaceId: string, status: string) =>
    ["workspace", workspaceId, "outputs", status] as const,
  output: (workspaceId: string, outputId: string) =>
    ["workspace", workspaceId, "output", outputId] as const,
  memories: (workspaceId: string) =>
    ["workspace", workspaceId, "memories"] as const,
  memory: (workspaceId: string, memoryId: string) =>
    ["workspace", workspaceId, "memory", memoryId] as const,
  activity: (workspaceId: string, range: string, date: string) =>
    ["workspace", workspaceId, "activity", range, date] as const,
};
