"use client";

import { useMemo } from "react";
import {
  workspaceLogs,
  workspaceTaskOutputs,
  workspaceWorkItems,
} from "./data";
import { WorkspaceGraphCanvas } from "./WorkspaceGraphView";
import { buildWorkspaceGraph } from "./workspaceGraphModel";
import type { WorkspaceUiData } from "./workspaceTypes";

export function WorkspaceGraphPreview({
  workspaceData,
}: {
  workspaceData?: WorkspaceUiData | null;
}) {
  const tasks = workspaceData?.tasks ?? workspaceWorkItems;
  const logs = workspaceData?.logs ?? workspaceLogs;
  const outputs = workspaceData?.outputs ?? workspaceTaskOutputs;
  const graph = useMemo(
    () =>
      buildWorkspaceGraph({
        tasks,
        logs,
        outputs,
        taskLinks: workspaceData?.taskLinks ?? [],
        logLinks: workspaceData?.logLinks ?? [],
      }),
    [logs, outputs, tasks, workspaceData],
  );
  const graphKey = graph.nodes.map((node) => node.id).join("|");

  return (
    <div className="mx-[18px] mb-[15px] mt-3 overflow-hidden rounded-xl border border-zinc-200">
      <WorkspaceGraphCanvas
        key={graphKey}
        graph={graph}
        heightClassName="h-[180px]"
        initialScale={2.5}
        emptyTitle="No graph data yet"
        emptyDescription="Create a task or log to start the workspace graph."
      />
    </div>
  );
}
