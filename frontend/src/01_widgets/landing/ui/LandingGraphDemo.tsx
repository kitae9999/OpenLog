"use client";

import { useMemo } from "react";
import { cn } from "@/shared/lib/cn";
import { graphCanvasSurfaceClassName } from "@/shared/ui/GraphCanvasBackdrop";
import { WorkspaceGraphCanvas } from "@/widgets/home-feed/ui/WorkspaceGraphView";
import { getPreviewWorkspaceData } from "@/widgets/home-feed/ui/previewWorkspaceDemo";
import { buildWorkspaceGraph } from "@/widgets/home-feed/ui/workspaceGraphModel";

export function LandingGraphDemo({ className }: { className?: string }) {
  const graph = useMemo(() => {
    const workspace = getPreviewWorkspaceData();
    return buildWorkspaceGraph({
      tasks: workspace.tasks,
      logs: workspace.logs,
      outputs: workspace.outputs,
      taskLinks: workspace.taskLinks,
      logLinks: workspace.logLinks,
      includeMemories: false,
    });
  }, []);

  const graphKey = graph.nodes.map((node) => node.id).join("|");

  return (
    <div
      className={cn(
        "relative h-[520px] w-full overflow-hidden rounded-2xl border border-zinc-200",
        graphCanvasSurfaceClassName,
        className,
      )}
    >
      <WorkspaceGraphCanvas
        key={graphKey}
        graph={graph}
        heightClassName="h-full"
        initialScale={1.35}
        className="h-full"
        disableNodeNavigation
        emptyTitle="No graph data yet"
        emptyDescription="Create a task or log to start the workspace graph."
      />
    </div>
  );
}
