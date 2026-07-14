"use client";

import { useMemo } from "react";
import { cn } from "@/shared/lib/cn";
import { graphCanvasSurfaceClassName } from "@/shared/ui/GraphCanvasBackdrop";
import { WorkspaceGraphCanvas } from "@/widgets/workspace-graph/ui/WorkspaceGraphView";
import { buildWorkspaceGraph } from "@/widgets/workspace-graph/model/workspaceGraphModel";
import type { WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

export function WorkspaceGraphPreview({
  workspaceData,
  heightClassName = "h-[180px]",
  initialScale = 1,
}: {
  workspaceData?: WorkspaceUiData | null;
  heightClassName?: string;
  initialScale?: number;
}) {
  const tasks = workspaceData?.tasks ?? [];
  const logs = workspaceData?.logs ?? [];
  const outputs = workspaceData?.outputs ?? [];
  const taskLinks = workspaceData?.taskLinks ?? [];
  const logLinks = workspaceData?.logLinks ?? [];
  const crossLinks = workspaceData?.crossLinks ?? [];
  const memories = workspaceData?.memories ?? [];
  const graph = useMemo(
    () =>
      buildWorkspaceGraph({
        tasks,
        logs,
        outputs,
        taskLinks,
        logLinks,
        crossLinks,
        memories,
      }),
    [crossLinks, logs, logLinks, memories, outputs, taskLinks, tasks],
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
        // Zoom into the seeded center so the settling cluster stays in frame.
        initialScale={initialScale}
        emptyTitle="No graph data yet"
        emptyDescription="Create a task or log to start the workspace graph."
      />
    </div>
  );
}
