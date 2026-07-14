import type { WorkspaceTaskOutput } from "@/entities/workspace/model/data";

const STORAGE_KEY = "openlog-output-overrides";

type OutputOverrideMap = Record<string, WorkspaceTaskOutput>;

function parseOverrides(raw: string | null): OutputOverrideMap {
  try {
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as OutputOverrideMap;
  } catch {
    return {};
  }
}

function readOverrides(): OutputOverrideMap {
  if (typeof window === "undefined") {
    return {};
  }

  return parseOverrides(window.localStorage.getItem(STORAGE_KEY));
}

function writeOverrides(overrides: OutputOverrideMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event(STORAGE_KEY));
}

export function getOutputOverrides() {
  return readOverrides();
}

export function getOutputOverridesSnapshot() {
  if (typeof window === "undefined") {
    return "{}";
  }

  return window.localStorage.getItem(STORAGE_KEY) ?? "{}";
}

export function subscribeOutputOverrides(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(STORAGE_KEY, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(STORAGE_KEY, listener);
    window.removeEventListener("storage", listener);
  };
}

export function getOutputsWithOverrides(baseOutputs: WorkspaceTaskOutput[]) {
  const overrides = readOverrides();
  return mergeOutputs(baseOutputs, overrides);
}

export function getOutputsWithOverrideSnapshot(
  baseOutputs: WorkspaceTaskOutput[],
  snapshot: string,
) {
  return mergeOutputs(baseOutputs, parseOverrides(snapshot));
}

function mergeOutputs(
  baseOutputs: WorkspaceTaskOutput[],
  overrides: OutputOverrideMap,
) {
  const merged = baseOutputs.map((output) => overrides[output.id] ?? output);
  const baseIds = new Set(baseOutputs.map((output) => output.id));
  const created = Object.values(overrides).filter((output) => !baseIds.has(output.id));

  return [...created, ...merged];
}

export function getOutputWithOverrides(
  outputId: string,
  baseOutputs: WorkspaceTaskOutput[],
) {
  return getOutputsWithOverrides(baseOutputs).find((output) => output.id === outputId);
}

export function getOutputWithOverrideSnapshot(
  outputId: string,
  baseOutputs: WorkspaceTaskOutput[],
  snapshot: string,
) {
  return getOutputsWithOverrideSnapshot(baseOutputs, snapshot).find(
    (output) => output.id === outputId,
  );
}

export function saveOutputOverride(output: WorkspaceTaskOutput) {
  const overrides = readOverrides();
  overrides[output.id] = output;
  writeOverrides(overrides);
}

export function createOutputOverride(input: {
  title: string;
  description: string;
  content: string;
  taskIds: string[];
  logIds: string[];
}) {
  const id = `output-${Date.now().toString(36)}`;
  const output: WorkspaceTaskOutput = {
    id,
    taskId: input.taskIds[0] ?? "",
    taskIds: input.taskIds,
    logIds: input.logIds,
    status: "draft",
    title: input.title,
    description: input.description,
    content: input.content,
    updatedLabel: "Just now",
  };

  saveOutputOverride(output);

  return output;
}
