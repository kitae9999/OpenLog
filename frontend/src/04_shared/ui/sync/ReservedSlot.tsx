"use client";

import { cn } from "@/shared/lib/cn";

export type ReservedSlotSize = "row" | "log" | "task" | "todo" | "card";

const sizeClassName: Record<ReservedSlotSize, string> = {
  row: "min-h-[52px]",
  log: "min-h-[88px]",
  task: "min-h-[56px]",
  todo: "min-h-[44px]",
  card: "min-h-[96px]",
};

/**
 * Empty rail that reserves the same footprint as a real list row.
 * Demo: pre-allocate N rails. Product: insert one pending rail while syncing.
 */
export function ReservedSlot({
  size = "row",
  pending = false,
  className,
}: {
  size?: ReservedSlotSize;
  /** Next slot awaiting fill — soft pulse while Fetching. */
  pending?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "sync-reserved-slot",
        sizeClassName[size],
        pending && "is-pending",
        className,
      )}
    />
  );
}

/** Renders `count` reserved rails (clamped at 0). */
export function ReservedSlotRail({
  count,
  size = "row",
  pendingIndex,
  className,
  slotClassName,
}: {
  count: number;
  size?: ReservedSlotSize;
  /** Relative index among empty rails that should pulse (usually 0 = next). */
  pendingIndex?: number;
  className?: string;
  slotClassName?: string;
}) {
  const n = Math.max(0, count);
  if (n === 0) {
    return null;
  }

  return (
    <div className={className}>
      {Array.from({ length: n }, (_, index) => (
        <ReservedSlot
          key={`reserved-${index}`}
          size={size}
          pending={pendingIndex === index}
          className={slotClassName}
        />
      ))}
    </div>
  );
}
