"use client";

import { cn } from "@/shared/lib/cn";

export function GraphZoomControls({
  onZoomIn,
  onZoomOut,
  canZoomIn = true,
  canZoomOut = true,
  scale,
  className,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
  scale?: number;
  className?: string;
}) {
  const scaleLabel =
    typeof scale === "number" ? `${Math.round(scale * 100)}%` : null;

  return (
    <div
      className={cn(
        "absolute right-2.5 top-2.5 z-10 flex w-8 flex-col overflow-hidden rounded-[10px] border border-zinc-200/80 bg-white/95 shadow-[0_1px_3px_rgba(24,24,27,0.08)] backdrop-blur-sm",
        className,
      )}
    >
      <ZoomButton
        label="Zoom in"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        icon="+"
      />
      {scaleLabel ? (
        <>
          <div className="h-px bg-zinc-200/80" aria-hidden="true" />
          <div
            aria-live="polite"
            aria-label={`Zoom ${scaleLabel}`}
            className="grid h-7 w-full place-items-center text-[8.5px] font-semibold tabular-nums tracking-tight text-zinc-500"
            onPointerDown={(event) => event.stopPropagation()}
          >
            {scaleLabel}
          </div>
        </>
      ) : null}
      <div className="h-px bg-zinc-200/80" aria-hidden="true" />
      <ZoomButton
        label="Zoom out"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        icon="−"
      />
    </div>
  );
}

function ZoomButton({
  label,
  onClick,
  disabled,
  icon,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn(
        "grid h-8 w-full place-items-center text-[18px] font-medium leading-none text-zinc-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/20",
        disabled
          ? "cursor-not-allowed text-zinc-300"
          : "hover:bg-zinc-50 hover:text-zinc-950",
      )}
    >
      {icon}
    </button>
  );
}
