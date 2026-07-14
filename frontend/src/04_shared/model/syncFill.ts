/** Shared sync UI state — demo replay + live workspace SSE. */

export type SyncFillZone =
  | "logs"
  | "tasks"
  | "todos"
  | "output"
  | "memory"
  | "brief";

export type SyncFillReserved = {
  tasks: number;
  logs: number;
  todos: number;
  output: number;
  memory: number;
};

export type SyncFillState = {
  status: "idle" | "fetching" | "filling" | "settled";
  zone?: SyncFillZone;
  reserved: SyncFillReserved;
  /** Among empty rails in the active zone, which one pulses (usually 0). */
  pendingSlotIndex?: number;
  /** Ids that should play enter animation this frame. */
  incomingIds: string[];
};

export const EMPTY_SYNC_RESERVED: SyncFillReserved = {
  tasks: 0,
  logs: 0,
  todos: 0,
  output: 0,
  memory: 0,
};

export const IDLE_SYNC_FILL: SyncFillState = {
  status: "idle",
  reserved: { ...EMPTY_SYNC_RESERVED },
  incomingIds: [],
};

export function isIncomingId(syncFill: SyncFillState, id: string) {
  return (
    (syncFill.status === "filling" || syncFill.status === "settled") &&
    syncFill.incomingIds.includes(id)
  );
}

export function isZoneFetching(syncFill: SyncFillState, zone: SyncFillZone) {
  return syncFill.status === "fetching" && syncFill.zone === zone;
}

export function parseSyncFillZone(value: string): SyncFillZone | undefined {
  switch (value) {
    case "logs":
    case "tasks":
    case "todos":
    case "output":
    case "memory":
    case "brief":
      return value;
    default:
      return undefined;
  }
}

export function diffIdSets(previous: Iterable<string>, next: Iterable<string>) {
  const prev = previous instanceof Set ? previous : new Set(previous);
  const incoming: string[] = [];
  for (const id of next) {
    if (!prev.has(id)) {
      incoming.push(id);
    }
  }
  return incoming;
}
