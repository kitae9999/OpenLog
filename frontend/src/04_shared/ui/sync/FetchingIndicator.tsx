"use client";

import { cn } from "@/shared/lib/cn";

/** Corner status chip — demo + product live-sync. */
export function FetchingIndicator({
  label = "Fetching",
  exiting = false,
  className,
}: {
  label?: string;
  /** Fade-out phase after sync completes. */
  exiting?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sync-fetching-toast",
        exiting && "is-exiting",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="sync-fetching-spinner" aria-hidden="true" />
      <span className="sync-fetching-label">{label}</span>
    </div>
  );
}
