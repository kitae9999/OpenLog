"use client";

import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { appQueryKeys } from "@/shared/api/queryKeys";

type WorkspaceChangedPayload = {
  workspaceId: number;
  zone: string;
  entityType: string;
  entityId: string;
  action: string;
  occurredAt: string;
};

const HIDDEN_DISCONNECT_GRACE_MS = 60_000;

export function useWorkspaceSse(workspaceId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;
    const currentWorkspaceId = workspaceId;
    const timers = new Map<string, number>();
    let disposed = false;
    let connectionController: AbortController | null = null;
    let hiddenTimer: number | null = null;
    let pausedForVisibility = document.hidden;

    function scheduleInvalidation(payload: WorkspaceChangedPayload) {
      const zone = normalizeZone(payload.zone || payload.entityType);
      const current = timers.get(zone);
      if (current !== undefined) window.clearTimeout(current);
      timers.set(
        zone,
        window.setTimeout(() => {
          timers.delete(zone);
          void invalidateForZone(queryClient, currentWorkspaceId, zone);
        }, 250),
      );
    }

    function openConnection() {
      if (disposed || document.hidden || connectionController) return;

      const controller = new AbortController();
      connectionController = controller;

      void subscribe({
        workspaceId: currentWorkspaceId,
        signal: controller.signal,
        onEvent: scheduleInvalidation,
        onUnauthorized: () => {
          queryClient.removeQueries({ queryKey: appQueryKeys.session });
          window.location.assign("/");
        },
      }).finally(() => {
        if (connectionController === controller) {
          connectionController = null;
          clearHiddenTimer();
        }
      });
    }

    function closeConnection() {
      const controller = connectionController;
      connectionController = null;
      controller?.abort();
    }

    function clearHiddenTimer() {
      if (hiddenTimer === null) return;
      window.clearTimeout(hiddenTimer);
      hiddenTimer = null;
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        if (connectionController === null || hiddenTimer !== null) return;
        hiddenTimer = window.setTimeout(() => {
          hiddenTimer = null;
          if (!document.hidden) return;
          pausedForVisibility = true;
          closeConnection();
        }, HIDDEN_DISCONNECT_GRACE_MS);
        return;
      }

      clearHiddenTimer();
      if (!pausedForVisibility) return;
      pausedForVisibility = false;
      openConnection();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    openConnection();

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearHiddenTimer();
      closeConnection();
      for (const timer of timers.values()) window.clearTimeout(timer);
      timers.clear();
    };
  }, [queryClient, workspaceId]);
}

async function subscribe({
  workspaceId,
  signal,
  onEvent,
  onUnauthorized,
}: {
  workspaceId: string;
  signal: AbortSignal;
  onEvent: (payload: WorkspaceChangedPayload) => void;
  onUnauthorized: () => void;
}) {
  let retryMs = 1_000;
  let refreshedSession = false;

  while (!signal.aborted) {
    await waitUntilConnectable(signal);
    if (signal.aborted) return;

    let response: Response;
    try {
      response = await fetch(`/api/workspaces/${workspaceId}/events`, {
        headers: { Accept: "text/event-stream" },
        cache: "no-store",
        signal,
      });
    } catch {
      if (signal.aborted) return;
      await abortableDelay(retryMs, signal);
      retryMs = Math.min(retryMs * 2, 30_000);
      continue;
    }

    if (response.status === 401) {
      if (!refreshedSession && (await refreshSession(signal))) {
        refreshedSession = true;
        continue;
      }
      onUnauthorized();
      return;
    }
    if (response.status === 403 || response.status === 404) return;
    if (response.status === 429 || response.status >= 500 || !response.body) {
      await abortableDelay(retryMs, signal);
      retryMs = Math.min(retryMs * 2, 30_000);
      continue;
    }
    if (!response.ok) return;

    retryMs = 1_000;
    refreshedSession = false;
    try {
      await readEventStream(response.body, signal, onEvent);
    } catch {
      if (signal.aborted) return;
    }
    await abortableDelay(retryMs, signal);
    retryMs = Math.min(retryMs * 2, 30_000);
  }
}

async function readEventStream(
  stream: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  onEvent: (payload: WorkspaceChangedPayload) => void,
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const parsed = parseWorkspaceEvent(block);
        if (parsed) onEvent(parsed);
        boundary = buffer.indexOf("\n\n");
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

function parseWorkspaceEvent(block: string): WorkspaceChangedPayload | null {
  let eventName = "message";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) eventName = line.slice(6).trim();
    if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (eventName !== "workspace.changed" || data.length === 0) return null;
  try {
    return JSON.parse(data.join("\n")) as WorkspaceChangedPayload;
  } catch {
    return null;
  }
}

async function invalidateForZone(
  queryClient: QueryClient,
  workspaceId: string,
  zone: string,
) {
  const resources = resourcesForZone(zone);
  await queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === "workspace" &&
      query.queryKey[1] === workspaceId &&
      resources.has(String(query.queryKey[2])),
    refetchType: "active",
  });
}

function resourcesForZone(zone: string) {
  if (zone === "tasks") return new Set(["tasks", "task", "navigation", "dashboard", "graph", "planner"]);
  if (zone === "logs") return new Set(["logs", "log", "navigation", "dashboard", "graph", "activity"]);
  if (zone === "todos") return new Set(["planner", "dashboard"]);
  if (zone === "outputs") return new Set(["outputs", "output", "dashboard", "graph"]);
  if (zone === "memories") return new Set(["memories", "memory", "dashboard", "graph"]);
  if (zone === "links") return new Set(["graph"]);
  return new Set(["dashboard"]);
}

function normalizeZone(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("task")) return "tasks";
  if (normalized.includes("log")) return "logs";
  if (normalized.includes("todo")) return "todos";
  if (normalized.includes("output")) return "outputs";
  if (normalized.includes("memor")) return "memories";
  if (normalized.includes("link")) return "links";
  return normalized;
}

async function refreshSession(signal: AbortSignal) {
  try {
    const response = await fetch("/auth/refresh", {
      method: "POST",
      cache: "no-store",
      signal,
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitUntilConnectable(signal: AbortSignal) {
  while (!signal.aborted && (document.hidden || !navigator.onLine)) {
    await Promise.race([
      once(document, "visibilitychange", signal),
      once(window, "online", signal),
    ]);
  }
}

function once(target: EventTarget, eventName: string, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    target.addEventListener(eventName, () => resolve(), { once: true, signal });
  });
}

function abortableDelay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) return resolve();
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
