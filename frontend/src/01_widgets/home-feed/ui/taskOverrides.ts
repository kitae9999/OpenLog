import type { WorkspaceWorkItem } from "./data";

const STORAGE_KEY = "openlog-task-overrides";

type TaskOverride = {
  title?: string;
  body?: string;
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
  override: { title: string; body: string },
) {
  const overrides = readOverrides();
  overrides[taskId] = override;
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
  };
}
