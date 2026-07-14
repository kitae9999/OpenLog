import type { WorkspaceWorkItem } from "@/entities/workspace/model/data";

const STORAGE_KEY = "openlog-task-overrides";

type TaskOverride = {
  title?: string;
  body?: string;
  status?: WorkspaceWorkItem["status"];
};

type TaskOverrideMap = Record<string, TaskOverride>;

function readOverrides(): TaskOverrideMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as TaskOverrideMap;
  } catch {
    return {};
  }
}

function writeOverrides(overrides: TaskOverrideMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function getTaskOverride(taskId: string): TaskOverride | undefined {
  return readOverrides()[taskId];
}

export function saveTaskOverride(
  taskId: string,
  override: {
    title: string;
    body: string;
    status?: WorkspaceWorkItem["status"];
  },
) {
  const overrides = readOverrides();
  const previous = overrides[taskId];
  overrides[taskId] = {
    ...previous,
    title: override.title,
    body: override.body,
    status: override.status ?? previous?.status,
  };
  writeOverrides(overrides);
}

export function mergeTaskWithOverrides(
  task: WorkspaceWorkItem,
): WorkspaceWorkItem {
  const override = getTaskOverride(task.id);
  if (!override) {
    return task;
  }

  return {
    ...task,
    title: override.title ?? task.title,
    body: override.body ?? task.body,
    status: override.status ?? task.status,
  };
}

export function createTaskOverride(input: {
  title: string;
  body: string;
  status?: WorkspaceWorkItem["status"];
}): WorkspaceWorkItem {
  const id = `task-${Date.now().toString(36)}`;
  const status = input.status ?? "todo";
  const task: WorkspaceWorkItem = {
    id,
    title: input.title,
    status,
    body: input.body,
  };

  saveTaskOverride(id, {
    title: input.title,
    body: input.body,
    status,
  });

  return task;
}
