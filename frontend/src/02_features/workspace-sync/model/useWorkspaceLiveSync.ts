"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  diffIdSets,
  EMPTY_SYNC_RESERVED,
  IDLE_SYNC_FILL,
  parseSyncFillZone,
  type SyncFillState,
  type SyncFillZone,
} from "@/shared/model/syncFill";

type WorkspaceChangedPayload = {
  workspaceId: number;
  zone: string;
  entityType: string;
  entityId: string;
  action: string;
  occurredAt: string;
};

const FETCHING_TOAST_EXIT_MS = 380;
const FILLING_HOLD_MS = 420;
const SETTLED_HOLD_MS = 400;

/**
 * Subscribe to workspace SSE and drive demo-shaped syncFill + router.refresh().
 */
export function useWorkspaceLiveSync({
  workspaceId,
  enabled,
}: {
  workspaceId?: number | null;
  enabled: boolean;
}) {
  const router = useRouter();
  const [syncFill, setSyncFill] = useState<SyncFillState>(IDLE_SYNC_FILL);
  const [fetchingToastExiting, setFetchingToastExiting] = useState(false);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const pendingRef = useRef<{ zone: SyncFillZone; entityId: string } | null>(
    null,
  );
  const settleTimersRef = useRef<number[]>([]);
  const snapshotReadyRef = useRef(false);

  const clearSettleTimers = useCallback(() => {
    for (const timer of settleTimersRef.current) {
      window.clearTimeout(timer);
    }
    settleTimersRef.current = [];
  }, []);

  const syncStatusRef = useRef(syncFill.status);
  syncStatusRef.current = syncFill.status;

  useEffect(() => {
    if (!enabled || workspaceId == null) {
      return;
    }

    let closed = false;
    let eventSource: EventSource | null = null;
    let retryTimer: number | null = null;
    let retryMs = 1000;

    const connect = () => {
      if (closed) {
        return;
      }

      eventSource = new EventSource(`/api/workspaces/${workspaceId}/events`);

      eventSource.addEventListener("workspace.changed", (event) => {
        let payload: WorkspaceChangedPayload;
        try {
          payload = JSON.parse(String((event as MessageEvent).data));
        } catch {
          return;
        }

        const zone = parseSyncFillZone(payload.zone);
        if (!zone) {
          return;
        }

        clearSettleTimers();
        pendingRef.current = { zone, entityId: String(payload.entityId) };
        setFetchingToastExiting(false);
        setSyncFill({
          status: "fetching",
          zone,
          reserved: { ...EMPTY_SYNC_RESERVED },
          pendingSlotIndex: 0,
          incomingIds: [String(payload.entityId)],
        });
        router.refresh();
      });

      eventSource.onopen = () => {
        retryMs = 1000;
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        if (closed) {
          return;
        }
        retryTimer = window.setTimeout(() => {
          retryTimer = null;
          connect();
        }, retryMs);
        retryMs = Math.min(retryMs * 2, 15_000);
      };
    };

    connect();

    return () => {
      closed = true;
      eventSource?.close();
      if (retryTimer != null) {
        window.clearTimeout(retryTimer);
      }
      clearSettleTimers();
    };
  }, [clearSettleTimers, enabled, router, workspaceId]);

  const noteEntityIds = useCallback(
    (ids: Iterable<string>) => {
      const next = new Set(Array.from(ids, String));
      const pending = pendingRef.current;

      if (!snapshotReadyRef.current) {
        prevIdsRef.current = next;
        snapshotReadyRef.current = true;
        return;
      }

      if (pending && syncStatusRef.current === "fetching") {
        const created = diffIdSets(prevIdsRef.current, next);
        const incomingIds =
          created.length > 0 ? created : [pending.entityId];

        setFetchingToastExiting(true);
        const exitTimer = window.setTimeout(() => {
          setFetchingToastExiting(false);
          setSyncFill({
            status: "filling",
            zone: pending.zone,
            reserved: { ...EMPTY_SYNC_RESERVED },
            incomingIds,
          });
          pendingRef.current = null;

          const settledTimer = window.setTimeout(() => {
            setSyncFill((current) => ({
              ...current,
              status: "settled",
            }));
            const idleTimer = window.setTimeout(() => {
              setSyncFill(IDLE_SYNC_FILL);
            }, SETTLED_HOLD_MS);
            settleTimersRef.current.push(idleTimer);
          }, FILLING_HOLD_MS);
          settleTimersRef.current.push(settledTimer);
        }, FETCHING_TOAST_EXIT_MS);
        settleTimersRef.current.push(exitTimer);
      }

      prevIdsRef.current = next;
    },
    [],
  );

  return {
    syncFill,
    noteEntityIds,
    showFetchingToast:
      syncFill.status === "fetching" || fetchingToastExiting,
    fetchingToastExiting,
  };
}
