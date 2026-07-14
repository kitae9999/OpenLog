import type { WorkspaceLogItem } from "@/entities/workspace/model/data";

const STORAGE_KEY = "openlog-log-overrides";

type LogOverride = {
  title?: string;
  body?: string;
  taskId?: string | null;
};

type LogOverrideMap = Record<string, LogOverride>;

function readOverrides(): LogOverrideMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as LogOverrideMap;
  } catch {
    return {};
  }
}

function writeOverrides(overrides: LogOverrideMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function getLogOverride(logId: string): LogOverride | undefined {
  return readOverrides()[logId];
}

export function saveLogOverride(
  logId: string,
  override: {
    title?: string;
    body?: string;
    taskId?: string | null;
  },
) {
  const overrides = readOverrides();
  const previous = overrides[logId];
  overrides[logId] = {
    ...previous,
    ...override,
  };
  writeOverrides(overrides);
}

export function mergeLogWithOverrides(log: WorkspaceLogItem): WorkspaceLogItem {
  const override = getLogOverride(log.id);
  if (!override) {
    return log;
  }

  return {
    ...log,
    title: override.title ?? log.title,
    body: override.body ?? log.body,
    taskId:
      override.taskId === null
        ? undefined
        : (override.taskId ?? log.taskId),
  };
}

export function createLogOverride(input: {
  kind: "ISSUE" | "FIX" | "DECISION" | "NOTE";
  title: string;
  body: string;
  taskId?: string;
}): WorkspaceLogItem {
  const id = `log-${Date.now().toString(36)}`;
  const labelByKind = {
    ISSUE: "Issue",
    FIX: "Fix",
    DECISION: "Decision",
    NOTE: "Log",
  } as const;
  const toneByKind = {
    ISSUE: "amber",
    FIX: "green",
    DECISION: "blue",
    NOTE: "zinc",
  } as const;

  const log: WorkspaceLogItem = {
    id,
    tone: toneByKind[input.kind],
    label: labelByKind[input.kind],
    kind: input.kind,
    title: input.title,
    description: input.body.slice(0, 120),
    meta: "Just now",
    href: `/logs/${id}`,
    taskId: input.taskId,
    body: input.body,
  };

  saveLogOverride(id, {
    title: input.title,
    body: input.body,
  });

  return log;
}
