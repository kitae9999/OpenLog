"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  recoverWorkspaceAfterReconnect,
  refreshWorkspaceChangeBatch,
  type WorkspaceChangedPayload,
} from "@/features/workspace-sync/model/workspaceImpactRefresh";
import { appQueryKeys } from "@/shared/api/queryKeys";

const HIDDEN_DISCONNECT_GRACE_MS = 60_000;
const CHANGE_BATCH_WINDOW_MS = 250;

export function useWorkspaceSse(workspaceId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;
    const currentWorkspaceId = workspaceId;
    const pendingEvents: WorkspaceChangedPayload[] = [];
    let disposed = false;
    let connectionController: AbortController | null = null;
    let hiddenTimer: number | null = null;
    let batchTimer: number | null = null;
    let pausedForVisibility = document.hidden;
    let hasConnected = false;
    let refreshChain = Promise.resolve();

    function enqueueRefresh(refresh: () => Promise<void>) {
      refreshChain = refreshChain
        .then(() => (disposed ? undefined : refresh()))
        .catch(() => undefined);
    }

    function clearBatch() {
      if (batchTimer !== null) {
        window.clearTimeout(batchTimer);
        batchTimer = null;
      }
      pendingEvents.splice(0);
    }

    function flushBatch() {
      batchTimer = null;
      const events = pendingEvents.splice(0);
      if (events.length === 0) return;
      enqueueRefresh(() =>
        refreshWorkspaceChangeBatch({
          queryClient,
          workspaceId: currentWorkspaceId,
          events,
        }),
      );
    }

    function scheduleRefresh(payload: WorkspaceChangedPayload) {
      if (String(payload.workspaceId) !== currentWorkspaceId) return;
      pendingEvents.push(payload);
      if (batchTimer !== null) return;
      batchTimer = window.setTimeout(flushBatch, CHANGE_BATCH_WINDOW_MS);
    }

    function recoverAfterReconnect() {
      clearBatch();
      enqueueRefresh(() =>
        recoverWorkspaceAfterReconnect({
          queryClient,
          workspaceId: currentWorkspaceId,
        }),
      );
    }

    function openConnection() {
      if (disposed || document.hidden || connectionController) return;

      const controller = new AbortController();
      connectionController = controller;

      void subscribe({
        workspaceId: currentWorkspaceId,
        signal: controller.signal,
        onEvent: scheduleRefresh,
        onConnected: (recoveredFromConnectionFailure) => {
          if (hasConnected || recoveredFromConnectionFailure) {
            recoverAfterReconnect();
          }
          hasConnected = true;
        },
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
      clearBatch();
    };
  }, [queryClient, workspaceId]);
}

async function subscribe({
  workspaceId,
  signal,
  onEvent,
  onConnected,
  onUnauthorized,
}: {
  workspaceId: string;
  signal: AbortSignal;
  onEvent: (payload: WorkspaceChangedPayload) => void;
  onConnected: (recoveredFromConnectionFailure: boolean) => void;
  onUnauthorized: () => void;
}) {
  let retryMs = 1_000;
  let refreshedSession = false;
  let connectionFailed = false;

  while (!signal.aborted) {
    connectionFailed =
      (await waitUntilConnectable(signal)) || connectionFailed;
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
      connectionFailed = true;
      await abortableDelay(retryMs, signal);
      retryMs = Math.min(retryMs * 2, 30_000);
      continue;
    }

    if (response.status === 401) {
      if (!refreshedSession && (await refreshSession(signal))) {
        connectionFailed = true;
        refreshedSession = true;
        continue;
      }
      onUnauthorized();
      return;
    }
    if (response.status === 403 || response.status === 404) return;
    if (response.status === 429 || response.status >= 500 || !response.body) {
      connectionFailed = true;
      await abortableDelay(retryMs, signal);
      retryMs = Math.min(retryMs * 2, 30_000);
      continue;
    }
    if (!response.ok) return;

    retryMs = 1_000;
    refreshedSession = false;
    onConnected(connectionFailed);
    connectionFailed = false;
    try {
      await readEventStream(response.body, signal, onEvent);
    } catch {
      if (signal.aborted) return;
    }
    connectionFailed = true;
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
  let waited = false;
  while (!signal.aborted && (document.hidden || !navigator.onLine)) {
    waited = true;
    await Promise.race([
      once(document, "visibilitychange", signal),
      once(window, "online", signal),
    ]);
  }
  return waited;
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
