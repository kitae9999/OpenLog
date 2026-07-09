"use client";

import { useMemo } from "react";
import { cn } from "@/shared/lib/cn";
import { graphCanvasSurfaceClassName } from "@/shared/ui/GraphCanvasBackdrop";
import { WorkspaceGraphCanvas } from "@/widgets/home-feed/ui/WorkspaceGraphView";
import type {
  WorkspaceGraph,
  WorkspaceGraphEdge,
  WorkspaceGraphNode,
  WorkspaceGraphNodeKind,
} from "@/widgets/home-feed/ui/workspaceGraphModel";

const LANDING_LINKED_NODE_COUNT = 80;
const LANDING_ORPHAN_NODE_COUNT = 20;
/** Extra nodes with degree 0–2 (sparse fringe). */
const LANDING_SPARSE_NODE_COUNT = 50;
const LANDING_CORE_COUNT =
  LANDING_LINKED_NODE_COUNT + LANDING_ORPHAN_NODE_COUNT;
const LANDING_NODE_COUNT = LANDING_CORE_COUNT + LANDING_SPARSE_NODE_COUNT;
const NODE_KINDS: WorkspaceGraphNodeKind[] = [
  "task",
  "log",
  "output",
  "memory",
];

/**
 * Sparse local links (no hard hubs) so force layout settles into a round
 * Obsidian-like cloud instead of a dense sticky ball.
 * Trailing orphan nodes stay unlinked; sparse fringe nodes have 0–2 edges.
 */
function buildLandingKnowledgeGraph(): WorkspaceGraph {
  const nodes: WorkspaceGraphNode[] = Array.from(
    { length: LANDING_NODE_COUNT },
    (_, index) => ({
      id: `landing-node-${index}`,
      kind: NODE_KINDS[index % NODE_KINDS.length]!,
      title: "",
      description: "",
      href: "#graph",
    }),
  );

  const edgeKeys = new Set<string>();
  const edges: WorkspaceGraphEdge[] = [];
  const degree = new Array<number>(LANDING_NODE_COUNT).fill(0);

  const pushEdge = (sourceIndex: number, targetIndex: number) => {
    if (
      sourceIndex < 0 ||
      targetIndex < 0 ||
      sourceIndex >= LANDING_NODE_COUNT ||
      targetIndex >= LANDING_NODE_COUNT ||
      sourceIndex === targetIndex
    ) {
      return false;
    }

    const a = Math.min(sourceIndex, targetIndex);
    const b = Math.max(sourceIndex, targetIndex);
    const key = `${a}-${b}`;
    if (edgeKeys.has(key)) {
      return false;
    }
    edgeKeys.add(key);
    degree[a]! += 1;
    degree[b]! += 1;

    edges.push({
      sourceId: nodes[a]!.id,
      targetId: nodes[b]!.id,
      label: "",
    });
    return true;
  };

  for (let index = 0; index < LANDING_LINKED_NODE_COUNT; index += 1) {
    // Ring backbone keeps the linked component connected.
    pushEdge(index, (index + 1) % LANDING_LINKED_NODE_COUNT);

    // A few short-range chords — enough structure, not enough to collapse.
    if (index % 3 === 0) {
      pushEdge(index, (index + 2) % LANDING_LINKED_NODE_COUNT);
    }
    if (index % 5 === 0) {
      pushEdge(index, (index + 4) % LANDING_LINKED_NODE_COUNT);
    }
    if (index % 11 === 0) {
      pushEdge(index, (index + 7) % LANDING_LINKED_NODE_COUNT);
    }
  }

  // 50 fringe nodes: each gets 0, 1, or 2 edges (to core or other fringe).
  for (let offset = 0; offset < LANDING_SPARSE_NODE_COUNT; offset += 1) {
    const index = LANDING_CORE_COUNT + offset;
    const edgeBudget = offset % 3; // 0, 1, or 2

    for (let link = 0; link < edgeBudget; link += 1) {
      if ((degree[index] ?? 0) >= 2) {
        break;
      }

      // Prefer short hops into the linked core; fall back to nearby fringe.
      const coreTarget =
        (offset * 3 + link * 11) % LANDING_LINKED_NODE_COUNT;
      const fringeTarget =
        LANDING_CORE_COUNT +
        ((offset + 1 + link * 2) % LANDING_SPARSE_NODE_COUNT);

      const candidates = [coreTarget, fringeTarget];
      for (const target of candidates) {
        if ((degree[index] ?? 0) >= 2) {
          break;
        }
        if ((degree[target] ?? 0) >= 2 && target >= LANDING_CORE_COUNT) {
          // Keep other fringe nodes within the 0–2 budget too.
          continue;
        }
        if (pushEdge(index, target)) {
          break;
        }
      }
    }
  }

  return { nodes, edges };
}

export function LandingGraphDemo({ className }: { className?: string }) {
  const graph = useMemo(() => buildLandingKnowledgeGraph(), []);
  const graphKey = `landing-graph-${graph.nodes.length}-${graph.edges.length}`;

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
        initialScale={0.35}
        className="h-full"
        disableNodeNavigation
        hideNodeLabels
        disableNodeFilters
        hideZoomControls
        forcePreset="obsidian"
        emptyTitle="No graph data yet"
        emptyDescription="Create a task or log to start the workspace graph."
      />
    </div>
  );
}
