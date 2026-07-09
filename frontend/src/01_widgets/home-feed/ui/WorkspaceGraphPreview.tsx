"use client";

import { useMemo } from "react";
import { cn } from "@/shared/lib/cn";
import { graphCanvasSurfaceClassName } from "@/shared/ui/GraphCanvasBackdrop";
import { WorkspaceGraphCanvas } from "./WorkspaceGraphView";
import { buildWorkspaceGraph } from "./workspaceGraphModel";
import type { WorkspaceUiData } from "./workspaceTypes";

export function WorkspaceGraphPreview({
  workspaceData,
  heightClassName = "h-[180px]",
}: {
  workspaceData?: WorkspaceUiData | null;
  heightClassName?: string;
}) {
  const tasks = workspaceData?.tasks ?? [];
  const logs = workspaceData?.logs ?? [];
  const outputs = workspaceData?.outputs ?? [];
  const taskLinks = workspaceData?.taskLinks ?? [];
  const logLinks = workspaceData?.logLinks ?? [];
  const graph = useMemo(
    () =>
      buildWorkspaceGraph({
        tasks,
        logs,
        outputs,
        taskLinks,
        logLinks,
      }),
    [logs, logLinks, outputs, taskLinks, tasks],
  );

  return (
    <div
      className={cn(
        "mx-[18px] mb-[15px] mt-3 overflow-hidden rounded-xl border border-zinc-200",
        graphCanvasSurfaceClassName,
      )}
    >
      <WorkspaceGraphCanvas
        graph={graph}
        heightClassName={heightClassName}
        initialScale={2.5}
        emptyTitle="No graph data yet"
        emptyDescription="Create a task or log to start the workspace graph."
      />
    </div>
  );
}
