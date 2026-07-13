"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { cn } from "@/shared/lib/cn";
import {
  GraphCanvasBackdrop,
  getGraphBackdropBounds,
  graphCanvasSurfaceClassName,
} from "@/shared/ui/GraphCanvasBackdrop";
import { GraphZoomControls } from "@/shared/ui/GraphZoomControls";
import {
  getTabHref,
  type WorkspaceWorkItem,
} from "./data";
import { LogTypeLabel } from "./LogTypeLabel";
import {
  buildWorkspaceGraph,
  getLogNodeId,
  getNodeFill,
  getNodeRadius,
  getNodeStroke,
  getTaskNodeId,
  getWorkspaceGraphTopologyKey,
  type WorkspaceGraph,
  type WorkspaceGraphEdge,
  type WorkspaceGraphNode,
} from "./workspaceGraphModel";
import type { WorkspaceUiData } from "./workspaceTypes";
import { WorkspaceLinkManager } from "./WorkspaceLinkManager";

type GraphTransform = {
  x: number;
  y: number;
  scale: number;
};
type GraphNodeState = WorkspaceGraphNode & {
  x: number;
  y: number;
  vx: number;
  vy: number;
};
type GraphNodeDrag = {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
};

const GRAPH_WIDTH = 920;
const GRAPH_HEIGHT = 620;
const MIN_GRAPH_ZOOM = 0.35;
const MAX_GRAPH_ZOOM = 3;
const LABEL_VISIBILITY_ZOOM = 0.7;
const INITIAL_GRAPH_SCALE = 1.18;
const GRAPH_CENTER_X = GRAPH_WIDTH / 2;
const GRAPH_CENTER_Y = GRAPH_HEIGHT / 2;
const LINK_DISTANCE = 96;
const LINK_FORCE = 0.018;
const DRAG_LINK_FORCE = 0.024;
const REPEL_FORCE = 520;
const CENTER_FORCE = 0.0012;
const DAMPING = 0.94;
/** Below this, exact pairwise repulsion is cheap enough. */
const EXACT_REPEL_NODE_LIMIT = 80;
/** Barnes–Hut opening angle; larger = faster/rougher, smaller = slower/more exact. */
const BARNES_HUT_THETA = 0.75;
const ALL_TASKS = "all";

type GraphForcePreset = "default" | "obsidian";

type GraphForceConfig = {
  linkDistance: number;
  linkForce: number;
  dragLinkForce: number;
  repelForce: number;
  centerForce: number;
  damping: number;
};

const FORCE_PRESETS: Record<GraphForcePreset, GraphForceConfig> = {
  default: {
    linkDistance: LINK_DISTANCE,
    linkForce: LINK_FORCE,
    dragLinkForce: DRAG_LINK_FORCE,
    repelForce: REPEL_FORCE,
    centerForce: CENTER_FORCE,
    damping: DAMPING,
  },
  // Obsidian-like: snappy repulsion into a compact round cloud.
  obsidian: {
    linkDistance: 112,
    linkForce: 0.02,
    dragLinkForce: 0.028,
    repelForce: 1750,
    centerForce: 0.00075,
    damping: 0.84,
  },
};

export function WorkspaceGraphView({
  isLoggedIn,
  workspaceData,
}: {
  isLoggedIn: boolean;
  workspaceData?: WorkspaceUiData | null;
}) {
  const tasks = workspaceData?.tasks ?? [];
  const logs = workspaceData?.logs ?? [];
  const outputs = workspaceData?.outputs ?? [];
  const [selectedTaskId, setSelectedTaskId] = useState(ALL_TASKS);
  const [searchQuery, setSearchQuery] = useState("");
  const fullGraph = useMemo(
    () =>
      buildWorkspaceGraph({
        tasks,
        logs,
        outputs,
        taskLinks: workspaceData?.taskLinks ?? [],
        logLinks: workspaceData?.logLinks ?? [],
        crossLinks: workspaceData?.crossLinks ?? [],
        memories: workspaceData?.memories ?? [],
      }),
    [logs, outputs, tasks, workspaceData],
  );
  const graph = useMemo(
    () => filterWorkspaceGraph(fullGraph, selectedTaskId, searchQuery, tasks),
    [fullGraph, selectedTaskId, searchQuery, tasks],
  );
  const graphKey = getWorkspaceGraphTopologyKey(graph);
  const selectedTask =
    selectedTaskId === ALL_TASKS
      ? null
      : tasks.find((task) => task.id === selectedTaskId);

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] font-medium text-zinc-400">
        <Link
          href={getTabHref("workspace", isLoggedIn)}
          className="transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          Workspace
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">Graph</span>
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
        <div className="border-b border-zinc-100 px-[18px] py-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[18px] font-bold tracking-[-0.01em] text-zinc-950">
                Workspace Graph
              </h1>
              <p className="mt-1 text-[13px] leading-5 text-zinc-500">
                {selectedTask
                  ? `${selectedTask.title} context`
                  : "Tasks, logs, outputs, and memory in one project map"}
              </p>
            </div>
            <GraphLegend />
          </div>

          <div className="mt-3 grid gap-2.5 md:grid-cols-[minmax(180px,260px)_minmax(0,1fr)]">
            <label className="block">
              <span className="sr-only">Filter by task</span>
              <select
                value={selectedTaskId}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  setSelectedTaskId(event.target.value)
                }
                className="h-9 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-700 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10"
              >
                <option value={ALL_TASKS}>All tasks</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="relative block">
              <span className="sr-only">Search graph</span>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <IconSearch className="size-4" />
              </span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search tasks, logs, outputs, memory..."
                className="h-9 w-full rounded-[10px] border border-zinc-200 bg-white pl-9 pr-3 text-[13px] font-medium text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10"
              />
            </label>
          </div>
        </div>

        <WorkspaceGraphCanvas key={graphKey} graph={graph} />
      </section>

      {workspaceData ? (
        <WorkspaceLinkManager workspaceData={workspaceData} />
      ) : null}

      <GraphResultList graph={graph} logs={logs} />
    </div>
  );
}

export function WorkspaceGraphCanvas({
  graph,
  heightClassName = "h-[520px]",
  className,
  initialScale = INITIAL_GRAPH_SCALE,
  emptyTitle = "No graph matches",
  emptyDescription = "Try another task filter or search term.",
  disableNodeNavigation = false,
  disableForceSimulation = false,
  hideNodeLabels = false,
  disableNodeFilters = false,
  hideZoomControls = false,
  forcePreset = "default",
}: {
  graph: WorkspaceGraph;
  heightClassName?: string;
  className?: string;
  initialScale?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Pan / zoom / drag only — skip navigating to node hrefs. */
  disableNodeNavigation?: boolean;
  /** Skip continuous force layout (use for large demo graphs). */
  disableForceSimulation?: boolean;
  /** Never render node title labels. */
  hideNodeLabels?: boolean;
  /** Skip SVG drop-shadow filters (cheaper for large demos). */
  disableNodeFilters?: boolean;
  /** Hide the zoom control bar. */
  hideZoomControls?: boolean;
  /** Force layout tuning. `obsidian` spreads into a round cloud. */
  forcePreset?: GraphForcePreset;
}) {
  const topologyKey = useMemo(
    () => getWorkspaceGraphTopologyKey(graph),
    [graph],
  );
  const seededNodes = useMemo(
    () => buildInitialGraphNodes(graph),
    // Rebuild seed positions only when membership changes — not on title churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- topologyKey is the intentional dep
    [topologyKey],
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [transform, setTransform] = useState<GraphTransform>(() =>
    clampGraphTransform({
      x: GRAPH_WIDTH * (1 - initialScale) * 0.5,
      y: GRAPH_HEIGHT * (1 - initialScale) * 0.5,
      scale: initialScale,
    }),
  );
  // Snapshot for React paint only — simulation mutates a ref and patches DOM.
  const [nodeSnapshot, setNodeSnapshot] = useState(seededNodes);
  const graphViewportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeStatesRef = useRef<GraphNodeState[]>(seededNodes);
  const nodeElementsRef = useRef<Map<string, SVGGElement>>(new Map());
  const edgeElementsRef = useRef<
    Map<string, { line: SVGLineElement; sourceId: string; targetId: string }>
  >(new Map());
  const transformRef = useRef(transform);
  const animationFrameRef = useRef(0);
  const isSimulatingRef = useRef(false);
  const edgesRef = useRef(graph.edges);
  const forcePresetRef = useRef(forcePreset);
  const topologyKeyRef = useRef<string | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const nodeDragRef = useRef<GraphNodeDrag | null>(null);
  const lastDragMovedRef = useRef(false);
  const showLabels =
    !hideNodeLabels && transform.scale >= LABEL_VISIBILITY_ZOOM;

  transformRef.current = transform;
  edgesRef.current = graph.edges;
  forcePresetRef.current = forcePreset;

  function stopSimulation() {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    isSimulatingRef.current = false;
  }

  function startSimulation() {
    if (disableForceSimulation) {
      return;
    }

    if (isSimulatingRef.current) {
      return;
    }

    isSimulatingRef.current = true;
    let coolFrames = 0;

    function tick() {
      const energy = stepForceSimulationInPlace(
        nodeStatesRef.current,
        edgesRef.current,
        FORCE_PRESETS[forcePresetRef.current],
        nodeDragRef.current?.id,
      );
      paintGraphPositions(
        nodeStatesRef.current,
        nodeElementsRef,
        edgeElementsRef,
      );

      // Settle when motion is tiny (unless a node is being dragged).
      if (!nodeDragRef.current && energy < 0.02) {
        coolFrames += 1;
      } else {
        coolFrames = 0;
      }

      if (coolFrames > 45) {
        isSimulatingRef.current = false;
        animationFrameRef.current = 0;
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(tick);
    }

    animationFrameRef.current = window.requestAnimationFrame(tick);
  }

  // Keep labels/meta in sync without restarting the force layout.
  useEffect(() => {
    if (topologyKeyRef.current !== topologyKey) {
      return;
    }
    if (nodeStatesRef.current.length === 0) {
      return;
    }

    const metaById = new Map(graph.nodes.map((node) => [node.id, node]));
    let changed = false;
    const synced = nodeStatesRef.current.map((node) => {
      const meta = metaById.get(node.id);
      if (!meta) {
        return node;
      }
      if (
        meta.title === node.title &&
        meta.description === node.description &&
        meta.href === node.href &&
        meta.kind === node.kind &&
        meta.taskId === node.taskId
      ) {
        return node;
      }
      changed = true;
      return {
        ...node,
        title: meta.title,
        description: meta.description,
        href: meta.href,
        kind: meta.kind,
        taskId: meta.taskId,
      };
    });

    if (!changed) {
      return;
    }

    nodeStatesRef.current = synced;
    setNodeSnapshot(synced);
  }, [graph, topologyKey]);

  // Restart layout only when node/edge membership (or force settings) change.
  useEffect(() => {
    const topologyChanged = topologyKeyRef.current !== topologyKey;
    topologyKeyRef.current = topologyKey;

    stopSimulation();

    const prevById = new Map(
      nodeStatesRef.current.map((node) => [node.id, node]),
    );
    const nextNodes =
      topologyChanged && prevById.size > 0
        ? seededNodes.map((node) => {
            const existing = prevById.get(node.id);
            if (!existing) {
              return { ...node };
            }
            return {
              ...node,
              x: existing.x,
              y: existing.y,
              vx: 0,
              vy: 0,
            };
          })
        : seededNodes.map((node) => ({ ...node }));

    setNodeSnapshot(nextNodes);
    nodeStatesRef.current = nextNodes.map((node) => ({ ...node }));

    const frame = window.requestAnimationFrame(() => {
      paintGraphPositions(
        nodeStatesRef.current,
        nodeElementsRef,
        edgeElementsRef,
      );
      if (!disableForceSimulation) {
        startSimulation();
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
      stopSimulation();
    };
  }, [disableForceSimulation, forcePreset, seededNodes, topologyKey]);

  // React re-renders (hover/zoom) rewrite SVG attributes from the snapshot —
  // re-apply the live simulation positions after paint.
  useLayoutEffect(() => {
    paintGraphPositions(
      nodeStatesRef.current,
      nodeElementsRef,
      edgeElementsRef,
    );
  });

  function zoomBy(factor: number) {
    setTransform((current) => {
      const nextScale = clamp(
        current.scale * factor,
        MIN_GRAPH_ZOOM,
        MAX_GRAPH_ZOOM,
      );
      if (nextScale === current.scale) {
        return current;
      }

      const centerX = GRAPH_WIDTH / 2;
      const centerY = GRAPH_HEIGHT / 2;
      const worldX = (centerX - current.x) / current.scale;
      const worldY = (centerY - current.y) / current.scale;

      return clampGraphTransform({
        scale: nextScale,
        x: centerX - worldX * nextScale,
        y: centerY - worldY * nextScale,
      });
    });
  }

  useEffect(() => {
    const graphViewport = graphViewportRef.current;
    if (!graphViewport) {
      return;
    }

    function handleNativeWheel(event: WheelEvent) {
      event.preventDefault();
      event.stopPropagation();

      const point = getSvgPoint(event.clientX, event.clientY);
      if (!point) {
        return;
      }

      setTransform((current) => {
        const nextScale = clamp(
          current.scale * (event.deltaY > 0 ? 0.88 : 1.12),
          MIN_GRAPH_ZOOM,
          MAX_GRAPH_ZOOM,
        );
        const worldX = (point.x - current.x) / current.scale;
        const worldY = (point.y - current.y) / current.scale;

        return clampGraphTransform({
          scale: nextScale,
          x: point.x - worldX * nextScale,
          y: point.y - worldY * nextScale,
        });
      });
    }

    graphViewport.addEventListener("wheel", handleNativeWheel, {
      passive: false,
    });

    return () => {
      graphViewport.removeEventListener("wheel", handleNativeWheel);
    };
  }, []);

  if (graph.nodes.length === 0) {
    return (
      <div className={cn("px-[18px] py-6", className)}>
        <div className="rounded-[8px] border border-dashed border-zinc-300 bg-zinc-50 px-5 py-6 text-sm text-zinc-500">
          <p className="font-semibold text-zinc-800">{emptyTitle}</p>
          <p className="mt-2 leading-6">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  const connectedIds = activeId
    ? new Set(
        graph.edges.flatMap((edge) =>
          edge.sourceId === activeId
            ? [edge.targetId]
            : edge.targetId === activeId
              ? [edge.sourceId]
              : [],
        ),
      )
    : null;

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) {
      return;
    }

    const point = getSvgPoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y,
      originX: transformRef.current.x,
      originY: transformRef.current.y,
      moved: false,
    };
    lastDragMovedRef.current = false;
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (nodeDragRef.current) {
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const point = getSvgPoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    const moved = Math.abs(dx) > 3 || Math.abs(dy) > 3;
    drag.moved = drag.moved || moved;
    lastDragMovedRef.current = drag.moved;

    setTransform((current) =>
      clampGraphTransform({
        ...current,
        x: drag.originX + dx,
        y: drag.originY + dy,
      }),
    );
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      lastDragMovedRef.current = dragRef.current.moved;
      dragRef.current = null;
    }
  }

  function handleNodeClick(event: MouseEvent<SVGGElement>, href: string) {
    if (lastDragMovedRef.current) {
      lastDragMovedRef.current = false;
      return;
    }

    if (disableNodeNavigation) {
      return;
    }

    window.location.assign(href);
  }

  function handleNodePointerDown(
    event: PointerEvent<SVGGElement>,
    id: string,
  ) {
    if (event.button !== 0) {
      return;
    }

    event.stopPropagation();
    const point = getWorldPoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    nodeDragRef.current = {
      id,
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y,
      moved: false,
    };
    lastDragMovedRef.current = false;
    moveDraggedNode(id, point.x, point.y, true);
    startSimulation();
  }

  function handleNodePointerMove(event: PointerEvent<SVGGElement>) {
    const drag = nodeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();
    const point = getWorldPoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    const moved =
      Math.abs(point.x - drag.startX) > 2 ||
      Math.abs(point.y - drag.startY) > 2;
    drag.moved = drag.moved || moved;
    lastDragMovedRef.current = drag.moved;
    moveDraggedNode(drag.id, point.x, point.y, false);
  }

  function handleNodePointerUp(event: PointerEvent<SVGGElement>) {
    const drag = nodeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();
    event.currentTarget.releasePointerCapture(event.pointerId);
    lastDragMovedRef.current = drag.moved;
    nodeDragRef.current = null;
  }

  function handleNodeKeyDown(event: KeyboardEvent<SVGGElement>, href: string) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    if (disableNodeNavigation) {
      return;
    }

    window.location.assign(href);
  }

  function getSvgPoint(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) {
      return null;
    }

    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) {
      return null;
    }

    const local = point.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }

  function getWorldPoint(clientX: number, clientY: number) {
    const point = getSvgPoint(clientX, clientY);
    if (!point) {
      return null;
    }

    const current = transformRef.current;
    return {
      x: (point.x - current.x) / current.scale,
      y: (point.y - current.y) / current.scale,
    };
  }

  function moveDraggedNode(
    id: string,
    x: number,
    y: number,
    resetVelocity: boolean,
  ) {
    const node = nodeStatesRef.current.find((item) => item.id === id);
    if (!node) {
      return;
    }

    node.x = x;
    node.y = y;
    if (resetVelocity) {
      node.vx = 0;
      node.vy = 0;
    }
    paintGraphPositions(
      nodeStatesRef.current,
      nodeElementsRef,
      edgeElementsRef,
    );
  }

  function registerNodeElement(id: string, element: SVGGElement | null) {
    if (element) {
      nodeElementsRef.current.set(id, element);
    } else {
      nodeElementsRef.current.delete(id);
    }
  }

  function registerEdgeElement(
    key: string,
    sourceId: string,
    targetId: string,
    element: SVGLineElement | null,
  ) {
    if (element) {
      edgeElementsRef.current.set(key, { line: element, sourceId, targetId });
    } else {
      edgeElementsRef.current.delete(key);
    }
  }

  return (
    <div
      ref={graphViewportRef}
      className={cn(
        "relative overscroll-contain",
        graphCanvasSurfaceClassName,
        className,
      )}
    >
      {!hideZoomControls ? (
        <GraphZoomControls
          onZoomIn={() => zoomBy(1.18)}
          onZoomOut={() => zoomBy(1 / 1.18)}
          canZoomIn={transform.scale < MAX_GRAPH_ZOOM - 0.001}
          canZoomOut={transform.scale > MIN_GRAPH_ZOOM + 0.001}
          scale={transform.scale}
        />
      ) : null}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="Workspace graph"
        className={cn(
          "w-full cursor-grab select-none bg-transparent active:cursor-grabbing",
          heightClassName,
        )}
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <g
          transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}
        >
          <GraphCanvasBackdrop width={GRAPH_WIDTH} height={GRAPH_HEIGHT} />
          {!disableNodeFilters ? (
            <defs>
              <filter
                id="workspace-node-shadow"
                x="-60%"
                y="-60%"
                width="220%"
                height="220%"
              >
                <feDropShadow
                  dx="0"
                  dy="1.2"
                  stdDeviation="1.4"
                  floodColor="#18181b"
                  floodOpacity="0.14"
                />
              </filter>
              <filter
                id="workspace-node-glow"
                x="-80%"
                y="-80%"
                width="260%"
                height="260%"
              >
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="2.4"
                  floodColor="#18181b"
                  floodOpacity="0.16"
                />
              </filter>
            </defs>
          ) : null}
          {graph.edges.map((edge, index) => {
            const key = `${edge.sourceId}-${edge.targetId}-${edge.label}-${index}`;
            const hasEndpoints =
              nodeSnapshot.some((node) => node.id === edge.sourceId) &&
              nodeSnapshot.some((node) => node.id === edge.targetId);
            if (!hasEndpoints) {
              return null;
            }

            const active =
              !activeId ||
              edge.sourceId === activeId ||
              edge.targetId === activeId;

            return (
              <line
                key={key}
                ref={(element) =>
                  registerEdgeElement(key, edge.sourceId, edge.targetId, element)
                }
                x1={0}
                y1={0}
                x2={0}
                y2={0}
                stroke={active ? "#71717a" : "#d4d4d8"}
                strokeWidth={active ? 1.1 : 0.7}
                strokeLinecap="round"
                opacity={active ? 0.55 : 0.28}
              />
            );
          })}

          {nodeSnapshot.map((node) => {
            const active =
              !activeId ||
              activeId === node.id ||
              (connectedIds?.has(node.id) ?? false);

            return (
              <g
                key={node.id}
                ref={(element) => registerNodeElement(node.id, element)}
                transform="translate(0 0)"
                role={disableNodeNavigation ? "img" : "link"}
                tabIndex={0}
                aria-label={
                  disableNodeNavigation
                    ? `${node.kind}: ${node.title}`
                    : `Open ${node.title}`
                }
                onPointerDown={(event) => handleNodePointerDown(event, node.id)}
                onPointerMove={handleNodePointerMove}
                onPointerUp={handleNodePointerUp}
                onPointerCancel={handleNodePointerUp}
                onClick={(event) => handleNodeClick(event, node.href)}
                onKeyDown={(event) => handleNodeKeyDown(event, node.href)}
                onMouseEnter={() => setActiveId(node.id)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(node.id)}
                onBlur={() => setActiveId(null)}
                className={cn(
                  "outline-none",
                  disableNodeNavigation ? "cursor-grab" : "cursor-pointer",
                )}
              >
                <WorkspaceGraphNodeShape
                  node={node}
                  active={active}
                  focused={activeId === node.id}
                  showLabel={showLabels}
                  disableFilters={disableNodeFilters}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function paintGraphPositions(
  nodes: GraphNodeState[],
  nodeElementsRef: { current: Map<string, SVGGElement> },
  edgeElementsRef: {
    current: Map<
      string,
      { line: SVGLineElement; sourceId: string; targetId: string }
    >;
  },
) {
  const byId = new Map(nodes.map((node) => [node.id, node] as const));

  for (const node of nodes) {
    const element = nodeElementsRef.current.get(node.id);
    if (element) {
      element.setAttribute("transform", `translate(${node.x} ${node.y})`);
    }
  }

  for (const edge of edgeElementsRef.current.values()) {
    const source = byId.get(edge.sourceId);
    const target = byId.get(edge.targetId);
    if (!source || !target) {
      continue;
    }
    edge.line.setAttribute("x1", String(source.x));
    edge.line.setAttribute("y1", String(source.y));
    edge.line.setAttribute("x2", String(target.x));
    edge.line.setAttribute("y2", String(target.y));
  }
}

function WorkspaceGraphNodeShape({
  node,
  active,
  focused,
  showLabel,
  disableFilters = false,
}: {
  node: GraphNodeState;
  active: boolean;
  focused: boolean;
  showLabel: boolean;
  disableFilters?: boolean;
}) {
  const radius = getNodeRadius(node.kind, focused);
  const fill = getNodeFill(node.kind, focused);
  const stroke = getNodeStroke(node.kind, focused);
  const isHollow = node.kind === "memory";

  return (
    <g opacity={active ? 1 : 0.42}>
      <circle cx={0} cy={0} r={radius + 14} fill="transparent" />
      {focused ? (
        <circle
          cx={0}
          cy={0}
          r={radius + 5}
          fill="none"
          stroke={isHollow ? "#a1a1aa" : fill}
          strokeWidth="1"
          opacity="0.22"
        />
      ) : null}
      <circle
        cx={0}
        cy={0}
        r={radius}
        fill={fill}
        stroke={isHollow ? stroke : "#ffffff"}
        strokeWidth={isHollow ? (focused ? 1.6 : 1.25) : focused ? 1.5 : 1.15}
        filter={
          disableFilters
            ? undefined
            : focused
              ? "url(#workspace-node-glow)"
              : "url(#workspace-node-shadow)"
        }
      />
      {!isHollow ? (
        <circle
          cx={0}
          cy={0}
          r={Math.max(radius - 2.4, 1.8)}
          fill="none"
          stroke={stroke}
          strokeWidth="0.7"
          opacity={focused ? 0.35 : 0.18}
        />
      ) : null}
      {showLabel && node.title ? (
        <text
          x={0}
          y={radius + 13}
          textAnchor="middle"
          className={cn(
            "pointer-events-none text-[9.5px] font-medium tracking-[-0.01em]",
            active ? "fill-zinc-700" : "fill-zinc-400",
          )}
        >
          {truncateNodeTitle(node.title)}
        </text>
      ) : null}
    </g>
  );
}


function GraphLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-zinc-400">
      <LegendItem
        label="Task"
        className="size-[10px] border border-white bg-zinc-800 shadow-[0_0_0_1px_rgba(24,24,27,0.12)]"
      />
      <LegendItem
        label="Log"
        className="size-2 border border-white bg-zinc-400 shadow-[0_0_0_1px_rgba(113,113,122,0.2)]"
      />
      <LegendItem
        label="Output"
        className="size-2.5 border border-white bg-blue-500 shadow-[0_0_0_1px_rgba(37,99,235,0.2)]"
      />
      <LegendItem
        label="Memory"
        className="size-2.5 border border-zinc-400 bg-white"
      />
    </div>
  );
}

function LegendItem({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("rounded-full", className)} />
      {label}
    </span>
  );
}

function GraphResultList({
  graph,
  logs,
}: {
  graph: WorkspaceGraph;
  logs: WorkspaceUiData["logs"];
}) {
  const taskNodes = graph.nodes.filter((node) => node.kind === "task");
  const logNodes = graph.nodes.filter((node) => node.kind === "log");

  return (
    <section className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
      <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
        <div className="flex items-center justify-between gap-3 px-[18px] pt-3.5">
          <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            Visible logs
          </h2>
          <span className="text-[11.5px] font-semibold tabular-nums text-zinc-400">
            {logNodes.length}
          </span>
        </div>
        <div className="pb-1.5 pt-1.5">
          {logNodes.length === 0 ? (
            <p className="border-t border-zinc-100 px-[18px] py-3 text-[13px] text-zinc-500">
              No logs in this graph view.
            </p>
          ) : (
            logNodes.map((node) => {
              const log = logs.find(
                (item) => getLogNodeId(item.id) === node.id,
              );

              return (
                <Link
                  key={node.id}
                  href={node.href}
                  className="block border-t border-zinc-100 px-[18px] py-3 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-zinc-950">
                      {node.title}
                    </h3>
                    {log ? <LogTypeLabel>{log.label}</LogTypeLabel> : null}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-5 text-zinc-500">
                    {node.description}
                  </p>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
        <div className="flex items-center justify-between gap-3 px-[18px] pt-3.5">
          <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            Tasks
          </h2>
          <span className="text-[11.5px] font-semibold tabular-nums text-zinc-400">
            {taskNodes.length}
          </span>
        </div>
        <div className="pb-1.5 pt-1.5">
          {taskNodes.map((node) => (
            <Link
              key={node.id}
              href={node.href}
              className="flex items-start gap-3 border-t border-zinc-100 px-[18px] py-3 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              <span className="mt-[5px] size-[9px] shrink-0 rounded-full bg-zinc-950" />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-[1.45] text-zinc-950">
                  {node.title}
                </span>
                <span className="mt-0.5 block text-[12px] text-zinc-500">
                  {node.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function filterWorkspaceGraph(
  graph: WorkspaceGraph,
  selectedTaskId: string,
  query: string,
  tasks: WorkspaceWorkItem[],
): WorkspaceGraph {
  let visibleIds = new Set(graph.nodes.map((node) => node.id));

  if (selectedTaskId !== ALL_TASKS) {
    visibleIds = new Set(
      graph.nodes
        .filter(
          (node) =>
            node.taskId === selectedTaskId ||
            node.id === getTaskNodeId(selectedTaskId),
        )
        .map((node) => node.id),
    );
  }

  const normalizedQuery = normalizeSearch(query);
  if (normalizedQuery) {
    const matches = graph.nodes
      .filter(
        (node) =>
          visibleIds.has(node.id) &&
          normalizeSearch(
            `${node.title} ${node.description} ${node.kind} ${getNodeTaskTitle(node, tasks)}`,
          ).includes(normalizedQuery),
      )
      .map((node) => node.id);
    const expandedMatches = new Set(matches);

    for (const edge of graph.edges) {
      if (!visibleIds.has(edge.sourceId) || !visibleIds.has(edge.targetId)) {
        continue;
      }

      if (matches.includes(edge.sourceId)) {
        expandedMatches.add(edge.targetId);
      }
      if (matches.includes(edge.targetId)) {
        expandedMatches.add(edge.sourceId);
      }
    }

    visibleIds = expandedMatches;
  }

  const nodes = graph.nodes.filter((node) => visibleIds.has(node.id));
  const edges = graph.edges.filter(
    (edge) => visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId),
  );

  return { nodes, edges };
}

function buildInitialGraphNodes(graph: WorkspaceGraph): GraphNodeState[] {
  const degree = new Map<string, number>();

  graph.nodes.forEach((node) => degree.set(node.id, 0));
  graph.edges.forEach((edge) => {
    degree.set(edge.sourceId, (degree.get(edge.sourceId) ?? 0) + 1);
    degree.set(edge.targetId, (degree.get(edge.targetId) ?? 0) + 1);
  });
  const sortedNodes = [...graph.nodes].sort((a, b) => {
    if (a.kind === "task" && b.kind !== "task") return -1;
    if (a.kind !== "task" && b.kind === "task") return 1;
    return (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0);
  });

  if (sortedNodes.length > 40) {
    // Start near a filled disk so repulsion settles into a round Obsidian-like cloud.
    const count = sortedNodes.length;
    return sortedNodes.map((node, index) => {
      const t = (index + 0.5) / count;
      const radius = Math.sqrt(t) * 170;
      const angle =
        index * Math.PI * (3 - Math.sqrt(5)) +
        deterministicJitter(node.id, 0.35);

      return {
        ...node,
        x:
          GRAPH_CENTER_X +
          Math.cos(angle) * radius +
          deterministicJitter(`${node.id}:x`, 18),
        y:
          GRAPH_CENTER_Y +
          Math.sin(angle) * radius +
          deterministicJitter(`${node.id}:y`, 18),
        vx: 0,
        vy: 0,
      };
    });
  }

  const density = Math.min(Math.max(graph.nodes.length, 1), 12) / 12;
  const radiusX = 150 + density * 74;
  const radiusY = 100 + density * 50;

  return sortedNodes.map((node, index) => {
    const nodeDegree = degree.get(node.id) ?? 0;

    if (sortedNodes.length === 1) {
      return {
        ...node,
        x: GRAPH_CENTER_X,
        y: GRAPH_CENTER_Y,
        vx: 0,
        vy: 0,
      };
    }

    const angle = -Math.PI / 2 + (index / sortedNodes.length) * Math.PI * 2;
    const taskPull = node.kind === "task" ? 0.24 : 0;
    const pullToCenter = Math.min(nodeDegree * 0.08 + taskPull, 0.42);

    return {
      ...node,
      x:
        GRAPH_CENTER_X +
        Math.cos(angle) * radiusX * (1 - pullToCenter) +
        deterministicJitter(node.id, 18),
      y:
        GRAPH_CENTER_Y +
        Math.sin(angle) * radiusY * (1 - pullToCenter) +
        deterministicJitter(`${node.id}:y`, 14),
      vx: 0,
      vy: 0,
    };
  });
}

function stepForceSimulationInPlace(
  nodes: GraphNodeState[],
  edges: WorkspaceGraphEdge[],
  force: GraphForceConfig,
  draggedId?: string,
) {
  if (nodes.length === 0) {
    return 0;
  }

  const byId = new Map(nodes.map((node) => [node.id, node] as const));

  if (nodes.length <= EXACT_REPEL_NODE_LIMIT) {
    applyExactRepulsion(nodes, force.repelForce, draggedId);
  } else {
    // Barnes–Hut: O(n log n) approximate repulsion for large graphs.
    applyBarnesHutRepulsion(nodes, force.repelForce, draggedId);
  }

  for (const edge of edges) {
    const source = byId.get(edge.sourceId);
    const target = byId.get(edge.targetId);
    if (!source || !target) {
      continue;
    }

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
    const springStrength =
      source.id === draggedId || target.id === draggedId
        ? force.dragLinkForce
        : force.linkForce;
    const forceAmount = (distance - force.linkDistance) * springStrength;
    const fx = (dx / distance) * forceAmount;
    const fy = (dy / distance) * forceAmount;

    if (source.id !== draggedId) {
      source.vx += fx;
      source.vy += fy;
    }
    if (target.id !== draggedId) {
      target.vx -= fx;
      target.vy -= fy;
    }
  }

  let energy = 0;
  for (const node of nodes) {
    if (node.id === draggedId) {
      node.vx = 0;
      node.vy = 0;
      continue;
    }

    node.vx += (GRAPH_CENTER_X - node.x) * force.centerForce;
    node.vy += (GRAPH_CENTER_Y - node.y) * force.centerForce;
    node.vx *= force.damping;
    node.vy *= force.damping;
    node.x += node.vx;
    node.y += node.vy;
    energy += node.vx * node.vx + node.vy * node.vy;
  }

  return energy;
}

function applyExactRepulsion(
  nodes: GraphNodeState[],
  repelForce: number,
  draggedId?: string,
) {
  for (let firstIndex = 0; firstIndex < nodes.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < nodes.length;
      secondIndex += 1
    ) {
      applyPairRepulsion(
        nodes[firstIndex]!,
        nodes[secondIndex]!,
        repelForce,
        draggedId,
      );
    }
  }
}

function applyPairRepulsion(
  first: GraphNodeState,
  second: GraphNodeState,
  repelForce: number,
  draggedId?: string,
) {
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const distanceSquared = Math.max(dx * dx + dy * dy, 64);
  const distance = Math.sqrt(distanceSquared);
  const forceAmount = repelForce / distanceSquared;
  const fx = (dx / distance) * forceAmount;
  const fy = (dy / distance) * forceAmount;

  if (first.id !== draggedId) {
    first.vx -= fx;
    first.vy -= fy;
  }
  if (second.id !== draggedId) {
    second.vx += fx;
    second.vy += fy;
  }
}

type BarnesHutNode = {
  minX: number;
  minY: number;
  size: number;
  mass: number;
  comX: number;
  comY: number;
  body: GraphNodeState | null;
  children: BarnesHutNode[] | null;
};

function applyBarnesHutRepulsion(
  nodes: GraphNodeState[],
  repelForce: number,
  draggedId?: string,
) {
  const tree = buildBarnesHutTree(nodes);
  if (!tree) {
    return;
  }

  for (const node of nodes) {
    if (node.id === draggedId) {
      continue;
    }
    accumulateBarnesHutForce(node, tree, repelForce, node.id);
  }
}

function buildBarnesHutTree(nodes: GraphNodeState[]): BarnesHutNode | null {
  if (nodes.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x);
    maxY = Math.max(maxY, node.y);
  }

  const span = Math.max(maxX - minX, maxY - minY, 1) * 1.08;
  const pad = span * 0.04;
  const root: BarnesHutNode = {
    minX: minX - pad,
    minY: minY - pad,
    size: span + pad * 2,
    mass: 0,
    comX: 0,
    comY: 0,
    body: null,
    children: null,
  };

  for (const node of nodes) {
    insertBarnesHutBody(root, node, 0);
  }

  return root;
}

function insertBarnesHutBody(
  cell: BarnesHutNode,
  body: GraphNodeState,
  depth: number,
) {
  // Soft depth cap avoids pathological stacks when many nodes share a point.
  if (depth > 24) {
    cell.mass += 1;
    cell.comX += (body.x - cell.comX) / cell.mass;
    cell.comY += (body.y - cell.comY) / cell.mass;
    return;
  }

  if (cell.mass === 0 && !cell.children) {
    cell.body = body;
    cell.mass = 1;
    cell.comX = body.x;
    cell.comY = body.y;
    return;
  }

  if (!cell.children) {
    const existing = cell.body;
    cell.body = null;
    cell.children = createBarnesHutChildren(cell);
    if (existing) {
      insertBarnesHutBody(
        pickBarnesHutChild(cell, existing.x, existing.y),
        existing,
        depth + 1,
      );
    }
  }

  const child = pickBarnesHutChild(cell, body.x, body.y);
  insertBarnesHutBody(child, body, depth + 1);

  cell.mass += 1;
  cell.comX += (body.x - cell.comX) / cell.mass;
  cell.comY += (body.y - cell.comY) / cell.mass;
}

function createBarnesHutChildren(cell: BarnesHutNode): BarnesHutNode[] {
  const half = cell.size / 2;
  const midX = cell.minX + half;
  const midY = cell.minY + half;

  return [
    {
      minX: cell.minX,
      minY: cell.minY,
      size: half,
      mass: 0,
      comX: 0,
      comY: 0,
      body: null,
      children: null,
    },
    {
      minX: midX,
      minY: cell.minY,
      size: half,
      mass: 0,
      comX: 0,
      comY: 0,
      body: null,
      children: null,
    },
    {
      minX: cell.minX,
      minY: midY,
      size: half,
      mass: 0,
      comX: 0,
      comY: 0,
      body: null,
      children: null,
    },
    {
      minX: midX,
      minY: midY,
      size: half,
      mass: 0,
      comX: 0,
      comY: 0,
      body: null,
      children: null,
    },
  ];
}

function pickBarnesHutChild(
  cell: BarnesHutNode,
  x: number,
  y: number,
): BarnesHutNode {
  const children = cell.children!;
  const half = cell.size / 2;
  const right = x >= cell.minX + half;
  const bottom = y >= cell.minY + half;
  if (!right && !bottom) return children[0]!;
  if (right && !bottom) return children[1]!;
  if (!right && bottom) return children[2]!;
  return children[3]!;
}

function accumulateBarnesHutForce(
  target: GraphNodeState,
  cell: BarnesHutNode,
  repelForce: number,
  targetId: string,
) {
  if (cell.mass === 0) {
    return;
  }

  // Leaf (single body or depth-capped cluster).
  if (!cell.children) {
    if (cell.body?.id === targetId && cell.mass === 1) {
      return;
    }
    const mass =
      cell.body?.id === targetId ? Math.max(cell.mass - 1, 0) : cell.mass;
    if (mass <= 0) {
      return;
    }
    applyDirectedRepulsion(target, cell.comX, cell.comY, mass, repelForce);
    return;
  }

  const dx = cell.comX - target.x;
  const dy = cell.comY - target.y;
  const distance = Math.sqrt(Math.max(dx * dx + dy * dy, 64));

  // Accept multipole approximation when the cell is far relative to its size.
  if (cell.size / distance < BARNES_HUT_THETA) {
    applyDirectedRepulsion(
      target,
      cell.comX,
      cell.comY,
      cell.mass,
      repelForce,
    );
    return;
  }

  for (const child of cell.children) {
    accumulateBarnesHutForce(target, child, repelForce, targetId);
  }
}

function applyDirectedRepulsion(
  target: GraphNodeState,
  sourceX: number,
  sourceY: number,
  sourceMass: number,
  repelForce: number,
) {
  const dx = sourceX - target.x;
  const dy = sourceY - target.y;
  const distanceSquared = Math.max(dx * dx + dy * dy, 64);
  const distance = Math.sqrt(distanceSquared);
  const forceAmount = (repelForce * sourceMass) / distanceSquared;
  target.vx -= (dx / distance) * forceAmount;
  target.vy -= (dy / distance) * forceAmount;
}


function getNodeTaskTitle(
  node: WorkspaceGraphNode,
  tasks: WorkspaceWorkItem[],
) {
  if (!node.taskId) {
    return "";
  }

  return tasks.find((task) => task.id === node.taskId)?.title ?? "";
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Keep the viewport inside the grid backdrop so empty (no-grid) space is unreachable. */
function clampGraphTransform(transform: GraphTransform): GraphTransform {
  const bounds = getGraphBackdropBounds(GRAPH_WIDTH, GRAPH_HEIGHT);
  const { scale } = transform;
  const minX = GRAPH_WIDTH - bounds.maxX * scale;
  const maxX = -bounds.minX * scale;
  const minY = GRAPH_HEIGHT - bounds.maxY * scale;
  const maxY = -bounds.minY * scale;

  return {
    scale,
    x: minX <= maxX ? clamp(transform.x, minX, maxX) : (minX + maxX) / 2,
    y: minY <= maxY ? clamp(transform.y, minY, maxY) : (minY + maxY) / 2,
  };
}

function deterministicJitter(value: string, amount: number) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return ((hash % 1000) / 1000 - 0.5) * amount;
}

function truncateNodeTitle(title: string) {
  return title.length > 24 ? `${title.slice(0, 23)}...` : title;
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
