"use client";

import Link from "next/link";
import {
  useEffect,
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
  getLogHref,
  getOutputHref,
  getTaskHref,
  getTabHref,
  workspaceLogs,
  workspaceMemories,
  workspaceTaskOutputs,
  workspaceWorkItems,
  type WorkspaceLogItem,
  type WorkspaceTaskOutput,
  type WorkspaceWorkItem,
} from "./data";
import { LogTypeLabel } from "./LogTypeLabel";
import type { WorkspaceUiData } from "./workspaceTypes";

type WorkspaceGraphNodeKind = "task" | "log" | "output" | "memory";
type WorkspaceGraphNode = {
  id: string;
  kind: WorkspaceGraphNodeKind;
  title: string;
  description: string;
  href: string;
  taskId?: string;
};
type WorkspaceGraphEdge = {
  sourceId: string;
  targetId: string;
  label: string;
};
type WorkspaceGraph = {
  nodes: WorkspaceGraphNode[];
  edges: WorkspaceGraphEdge[];
};
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
const ALL_TASKS = "all";

export function WorkspaceGraphView({
  isLoggedIn,
  workspaceData,
}: {
  isLoggedIn: boolean;
  workspaceData?: WorkspaceUiData | null;
}) {
  const tasks = workspaceData?.tasks ?? workspaceWorkItems;
  const logs = workspaceData?.logs ?? workspaceLogs;
  const outputs = workspaceData?.outputs ?? workspaceTaskOutputs;
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
      }),
    [logs, outputs, tasks, workspaceData],
  );
  const graph = useMemo(
    () => filterWorkspaceGraph(fullGraph, selectedTaskId, searchQuery, tasks),
    [fullGraph, selectedTaskId, searchQuery, tasks],
  );
  const graphKey = graph.nodes.map((node) => node.id).join("|");
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

      <GraphResultList graph={graph} />
    </div>
  );
}

function WorkspaceGraphCanvas({ graph }: { graph: WorkspaceGraph }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [transform, setTransform] = useState<GraphTransform>({
    x: GRAPH_WIDTH * (1 - INITIAL_GRAPH_SCALE) * 0.5,
    y: GRAPH_HEIGHT * (1 - INITIAL_GRAPH_SCALE) * 0.5,
    scale: INITIAL_GRAPH_SCALE,
  });
  const [nodeStates, setNodeStates] = useState<GraphNodeState[]>(() =>
    buildInitialGraphNodes(graph),
  );
  const graphViewportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
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
  const nodeStatesById = useMemo(
    () => new Map(nodeStates.map((node) => [node.id, node] as const)),
    [nodeStates],
  );
  const showLabels = transform.scale >= LABEL_VISIBILITY_ZOOM;

  useEffect(() => {
    let animationFrame = 0;

    function tick() {
      setNodeStates((current) =>
        stepForceSimulation(current, graph.edges, nodeDragRef.current?.id),
      );
      animationFrame = window.requestAnimationFrame(tick);
    }

    animationFrame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [graph.edges]);

  useEffect(() => {
    const graphViewport = graphViewportRef.current;
    if (!graphViewport) {
      return;
    }

    function handleNativeWheel(event: WheelEvent) {
      event.preventDefault();
      event.stopPropagation();

      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const point = {
        x: ((event.clientX - rect.left) / rect.width) * GRAPH_WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * GRAPH_HEIGHT,
      };

      setTransform((current) => {
        const nextScale = clamp(
          current.scale * (event.deltaY > 0 ? 0.88 : 1.12),
          MIN_GRAPH_ZOOM,
          MAX_GRAPH_ZOOM,
        );
        const worldX = (point.x - current.x) / current.scale;
        const worldY = (point.y - current.y) / current.scale;

        return {
          scale: nextScale,
          x: point.x - worldX * nextScale,
          y: point.y - worldY * nextScale,
        };
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
      <div className="px-[18px] py-6">
        <div className="rounded-[8px] border border-dashed border-zinc-300 bg-zinc-50 px-5 py-6 text-sm text-zinc-500">
          <p className="font-semibold text-zinc-800">No graph matches</p>
          <p className="mt-2 leading-6">
            Try another task filter or search term.
          </p>
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
      originX: transform.x,
      originY: transform.y,
      moved: false,
    };
    lastDragMovedRef.current = false;
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
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

    setTransform((current) => ({
      ...current,
      x: drag.originX + dx,
      y: drag.originY + dy,
    }));
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
    window.location.assign(href);
  }

  function getSvgPoint(clientX: number, clientY: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }

    return {
      x: ((clientX - rect.left) / rect.width) * GRAPH_WIDTH,
      y: ((clientY - rect.top) / rect.height) * GRAPH_HEIGHT,
    };
  }

  function getWorldPoint(clientX: number, clientY: number) {
    const point = getSvgPoint(clientX, clientY);
    if (!point) {
      return null;
    }

    return {
      x: (point.x - transform.x) / transform.scale,
      y: (point.y - transform.y) / transform.scale,
    };
  }

  function moveDraggedNode(
    id: string,
    x: number,
    y: number,
    resetVelocity: boolean,
  ) {
    setNodeStates((current) =>
      current.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            x,
            y,
            vx: resetVelocity ? 0 : node.vx,
            vy: resetVelocity ? 0 : node.vy,
          };
        }

        return node;
      }),
    );
  }

  return (
    <div ref={graphViewportRef} className="overscroll-contain">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
        role="img"
        aria-label="Workspace graph"
        className="h-[520px] w-full cursor-grab select-none bg-[radial-gradient(circle_at_50%_45%,#f4f4f5_0,#fff_56%)] active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <g
          transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}
        >
          {graph.edges.map((edge, index) => {
            const source = nodeStatesById.get(edge.sourceId);
            const target = nodeStatesById.get(edge.targetId);
            if (!source || !target) {
              return null;
            }

            const active =
              !activeId ||
              edge.sourceId === activeId ||
              edge.targetId === activeId;

            return (
              <line
                key={`${edge.sourceId}-${edge.targetId}-${edge.label}-${index}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                className="transition"
                stroke={active ? "#52525b" : "#d4d4d8"}
                strokeWidth={active ? 0.9 : 0.5}
                strokeLinecap="round"
                opacity={active ? 0.5 : 0.32}
              />
            );
          })}

          {nodeStates.map((node) => {
            const active =
              !activeId ||
              activeId === node.id ||
              (connectedIds?.has(node.id) ?? false);

            return (
              <g
                key={node.id}
                role="link"
                tabIndex={0}
                aria-label={`Open ${node.title}`}
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
                className="cursor-pointer outline-none"
              >
                <WorkspaceGraphNodeShape
                  node={node}
                  active={active}
                  focused={activeId === node.id}
                  showLabel={showLabels}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function WorkspaceGraphNodeShape({
  node,
  active,
  focused,
  showLabel,
}: {
  node: GraphNodeState;
  active: boolean;
  focused: boolean;
  showLabel: boolean;
}) {
  const radius = getNodeRadius(node.kind, focused);

  return (
    <g className="transition">
      <circle cx={node.x} cy={node.y} r={radius + 12} fill="transparent" />
      {node.kind === "memory" ? (
        <circle
          cx={node.x}
          cy={node.y}
          r={radius}
          fill="#ffffff"
          stroke={focused ? "#18181b" : "#71717a"}
          strokeWidth={focused ? 1.8 : 1.3}
          opacity={active ? 0.98 : 0.56}
          className="transition"
        />
      ) : (
        <circle
          cx={node.x}
          cy={node.y}
          r={radius}
          fill={getNodeFill(node.kind, focused)}
          opacity={active ? 0.96 : 0.56}
          className="transition"
        />
      )}
      {showLabel ? (
        <text
          x={node.x}
          y={node.y + radius + 14}
          textAnchor="middle"
          className={cn(
            "pointer-events-none text-[10px] font-medium transition",
            active ? "fill-zinc-800" : "fill-zinc-500",
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
      <LegendItem label="Task" className="size-[10px] bg-zinc-950" />
      <LegendItem label="Log" className="size-2 bg-zinc-400" />
      <LegendItem label="Output" className="size-2.5 bg-blue-600" />
      <LegendItem
        label="Memory"
        className="size-2.5 border border-zinc-600 bg-white"
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

function GraphResultList({ graph }: { graph: WorkspaceGraph }) {
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
              const log = workspaceLogs.find(
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

function buildWorkspaceGraph({
  tasks,
  logs,
  outputs,
  taskLinks,
  logLinks,
}: {
  tasks: WorkspaceWorkItem[];
  logs: WorkspaceLogItem[];
  outputs: WorkspaceTaskOutput[];
  taskLinks: WorkspaceUiData["taskLinks"];
  logLinks: WorkspaceUiData["logLinks"];
}): WorkspaceGraph {
  const nodes: WorkspaceGraphNode[] = [
    ...tasks.map((task) => ({
      id: getTaskNodeId(task.id),
      kind: "task" as const,
      title: task.title,
      description: getTaskNodeDescription(task, logs),
      href: getTaskHref(task.id),
      taskId: task.id,
    })),
    ...logs.map((log) => ({
      id: getLogNodeId(log.id),
      kind: "log" as const,
      title: log.title,
      description: log.description,
      href: getLogHref(log.id),
      taskId: log.taskId,
    })),
    ...outputs.map((output) => ({
      id: getOutputNodeId(output.id),
      kind: "output" as const,
      title: output.title,
      description: output.description,
      href: getOutputHref(output.id),
      taskId: output.taskId,
    })),
    ...workspaceMemories.map((memory, index) => ({
      id: getMemoryNodeId(index),
      kind: "memory" as const,
      title: memory.title,
      description: memory.description,
      href: getTabHref("workspace", true),
      taskId: inferMemoryTaskId(memory.title, memory.description),
    })),
  ];
  const edges: WorkspaceGraphEdge[] = [];

  for (const log of logs) {
    if (log.taskId) {
      edges.push({
        sourceId: getTaskNodeId(log.taskId),
        targetId: getLogNodeId(log.id),
        label: "captured",
      });
    }
  }

  for (const output of outputs) {
    for (const taskId of output.taskIds) {
      edges.push({
        sourceId: getTaskNodeId(taskId),
        targetId: getOutputNodeId(output.id),
        label: "refined",
      });
    }
    for (const logId of output.logIds) {
      edges.push({
        sourceId: getLogNodeId(logId),
        targetId: getOutputNodeId(output.id),
        label: "source",
      });
    }
  }

  for (const link of taskLinks) {
    edges.push({
      sourceId: getTaskNodeId(link.fromTaskId),
      targetId: getTaskNodeId(link.toTaskId),
      label: link.relation.toLowerCase().replaceAll("_", " "),
    });
  }

  for (const link of logLinks) {
    edges.push({
      sourceId: getLogNodeId(link.fromLogId),
      targetId: getLogNodeId(link.toLogId),
      label: link.relation.toLowerCase().replaceAll("_", " "),
    });
  }

  workspaceMemories.forEach((memory, index) => {
    const taskId = inferMemoryTaskId(memory.title, memory.description);
    if (!taskId) {
      return;
    }

    edges.push({
      sourceId: getTaskNodeId(taskId),
      targetId: getMemoryNodeId(index),
      label: "remembered",
    });
  });

  for (let index = 0; index < logs.length; index += 1) {
    const log = logs[index];
    const nextLog = logs[index + 1];
    if (!nextLog || log.taskId !== nextLog.taskId || !log.taskId) {
      continue;
    }

    edges.push({
      sourceId: getLogNodeId(log.id),
      targetId: getLogNodeId(nextLog.id),
      label: "sequence",
    });
  }

  return { nodes, edges: dedupeEdges(edges, nodes) };
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
  const density = Math.min(Math.max(graph.nodes.length, 1), 12) / 12;
  const radiusX = 150 + density * 74;
  const radiusY = 100 + density * 50;
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

  return sortedNodes.map((node, index) => {
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
    const nodeDegree = degree.get(node.id) ?? 0;
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

function stepForceSimulation(
  nodes: GraphNodeState[],
  edges: WorkspaceGraphEdge[],
  draggedId?: string,
) {
  if (nodes.length === 0) {
    return nodes;
  }

  const nextNodes = nodes.map((node) => ({ ...node }));
  const byId = new Map(nextNodes.map((node) => [node.id, node] as const));

  for (let firstIndex = 0; firstIndex < nextNodes.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < nextNodes.length;
      secondIndex += 1
    ) {
      const first = nextNodes[firstIndex];
      const second = nextNodes[secondIndex];
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      const distanceSquared = Math.max(dx * dx + dy * dy, 64);
      const distance = Math.sqrt(distanceSquared);
      const force = REPEL_FORCE / distanceSquared;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      if (first.id !== draggedId) {
        first.vx -= fx;
        first.vy -= fy;
      }
      if (second.id !== draggedId) {
        second.vx += fx;
        second.vy += fy;
      }
    }
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
        ? DRAG_LINK_FORCE
        : LINK_FORCE;
    const force = (distance - LINK_DISTANCE) * springStrength;
    const fx = (dx / distance) * force;
    const fy = (dy / distance) * force;

    if (source.id !== draggedId) {
      source.vx += fx;
      source.vy += fy;
    }
    if (target.id !== draggedId) {
      target.vx -= fx;
      target.vy -= fy;
    }
  }

  for (const node of nextNodes) {
    if (node.id === draggedId) {
      node.vx = 0;
      node.vy = 0;
      continue;
    }

    node.vx += (GRAPH_CENTER_X - node.x) * CENTER_FORCE;
    node.vy += (GRAPH_CENTER_Y - node.y) * CENTER_FORCE;
    node.vx *= DAMPING;
    node.vy *= DAMPING;
    node.x += node.vx;
    node.y += node.vy;
  }

  return nextNodes;
}

function getTaskNodeDescription(
  task: WorkspaceWorkItem,
  logs: WorkspaceLogItem[],
) {
  const logCount = logs.filter((log) => log.taskId === task.id).length;

  return `${task.status} · ${logCount} log${logCount === 1 ? "" : "s"}`;
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

function inferMemoryTaskId(title: string, description: string) {
  const value = normalizeSearch(`${title} ${description}`);

  if (value.includes("turbopack")) {
    return "pnpm-migration";
  }
  if (value.includes("auth") || value.includes("cli")) {
    return "workspace-view";
  }

  return undefined;
}

function dedupeEdges(edges: WorkspaceGraphEdge[], nodes: WorkspaceGraphNode[]) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const seen = new Set<string>();

  return edges.filter((edge) => {
    if (!nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId)) {
      return false;
    }

    const key = `${edge.sourceId}:${edge.targetId}:${edge.label}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getNodeRadius(kind: WorkspaceGraphNodeKind, focused: boolean) {
  if (kind === "task") {
    return focused ? 11 : 9;
  }
  if (kind === "output") {
    return focused ? 8.2 : 6.4;
  }
  if (kind === "memory") {
    return focused ? 8 : 6.2;
  }

  return focused ? 7.5 : 5.6;
}

function getNodeFill(kind: WorkspaceGraphNodeKind, focused: boolean) {
  if (kind === "task") {
    return "#09090b";
  }
  if (kind === "output") {
    return focused ? "#1d4ed8" : "#2563eb";
  }
  if (kind === "memory") {
    return "#ffffff";
  }

  return focused ? "#18181b" : "#a1a1aa";
}

function getTaskNodeId(taskId: string) {
  return `task:${taskId}`;
}

function getLogNodeId(logId: string) {
  return `log:${logId}`;
}

function getOutputNodeId(outputId: string) {
  return `output:${outputId}`;
}

function getMemoryNodeId(index: number) {
  return `memory:${index}`;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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
