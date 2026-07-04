import type { WorkspaceLogItem } from "./data";

const STORAGE_KEY = "openlog-log-overrides";

type LogOverride = {
  title?: string;
  body?: string;
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
  override: { title: string; body: string },
) {
  const overrides = readOverrides();
  overrides[logId] = override;
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
  };
}
