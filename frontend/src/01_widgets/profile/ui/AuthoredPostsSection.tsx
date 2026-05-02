"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import type { PublicUserPostSummary } from "@/entities/user/api/getPublicUserPosts";
import type { PublicUserPostGraph } from "@/entities/user/api/getPublicUserPostGraph";
import { assets } from "@/shared/config/assets";
import { buildPublicPostPath } from "@/shared/lib/publicRoutes";
import { cn } from "@/shared/lib/cn";

type AuthoredPostsView = "list" | "graph";
type GraphTransform = {
  x: number;
  y: number;
  scale: number;
};
type GraphNodeState = {
  slug: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
};
type GraphNodeDrag = {
  slug: string;
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
const LINK_DISTANCE = 92;
const LINK_FORCE = 0.018;
const DRAG_LINK_FORCE = 0.024;
const REPEL_FORCE = 460;
const CENTER_FORCE = 0.0012;
const DAMPING = 0.94;

export function AuthoredPostsSection({
  username,
  profileName,
  profileImageUrl,
  posts,
  graph,
}: {
  username: string;
  profileName: string;
  profileImageUrl?: string | null;
  posts: PublicUserPostSummary[];
  graph: PublicUserPostGraph;
}) {
  const [view, setView] = useState<AuthoredPostsView>("list");

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-500">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </div>
        <div className="rounded-xl bg-zinc-100 p-1">
          <div className="flex items-center gap-1">
            <AuthoredPostsModeButton
              active={view === "list"}
              label="List"
              onClick={() => setView("list")}
            />
            <AuthoredPostsModeButton
              active={view === "graph"}
              label="Graph"
              onClick={() => setView("graph")}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 min-h-[520px]">
        {view === "list" ? (
          <AuthoredPostList
            username={username}
            profileName={profileName}
            profileImageUrl={profileImageUrl}
            posts={posts}
          />
        ) : (
          <SecondBrainGraph username={username} graph={graph} />
        )}
      </div>
    </div>
  );
}

function AuthoredPostsModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center rounded-[8px] px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        active
          ? "bg-white text-zinc-950 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]"
          : "text-zinc-500 hover:text-zinc-950",
      )}
    >
      {label}
    </button>
  );
}

function AuthoredPostList({
  username,
  profileName,
  profileImageUrl,
  posts,
}: {
  username: string;
  profileName: string;
  profileImageUrl?: string | null;
  posts: PublicUserPostSummary[];
}) {
  if (posts.length === 0) {
    return (
      <EmptyGraphState
        title="No posts yet"
        description="This profile has not published any posts."
      />
    );
  }

  return (
    <div>
      {posts.map((post, index) => (
        <Link
          key={post.slug}
          href={buildPublicPostPath(username, post.slug)}
          className="group grid grid-cols-[minmax(0,1fr)_64px] items-start gap-4 rounded-xl border-b border-zinc-200/80 px-2 py-4 transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Image
                src={profileImageUrl ?? assets.defaultAvatar}
                alt=""
                width={20}
                height={20}
                aria-hidden="true"
                className="size-5 rounded-full object-cover"
              />
              <span className="font-medium text-zinc-900">{profileName}</span>
            </div>

            <h2 className="mt-2 [font-family:Georgia,serif] text-[17px] font-bold leading-6 tracking-normal text-zinc-950">
              {post.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {post.description}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
              <span>{post.publishedAtLabel}</span>
            </div>
          </div>

          <div className="relative size-16 overflow-hidden rounded-[4px] bg-zinc-200">
            <Image
              src={index % 2 === 0 ? assets.featuredCover : assets.postCover}
              alt={`${post.title} thumbnail`}
              fill
              sizes="64px"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}

function SecondBrainGraph({
  username,
  graph,
}: {
  username: string;
  graph: PublicUserPostGraph;
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
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
  const nodeStatesBySlug = useMemo(
    () => new Map(nodeStates.map((node) => [node.slug, node] as const)),
    [nodeStates],
  );
  const showLabels = transform.scale >= LABEL_VISIBILITY_ZOOM;

  useEffect(() => {
    let animationFrame = 0;

    function tick() {
      setNodeStates((current) =>
        stepForceSimulation(current, graph.edges, nodeDragRef.current?.slug),
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
      <EmptyGraphState
        title="No posts yet"
        description="Publish posts to start building a second brain graph."
      />
    );
  }

  const connectedSlugs = activeSlug
    ? new Set(
        graph.edges.flatMap((edge) =>
          edge.sourceSlug === activeSlug
            ? [edge.targetSlug]
            : edge.targetSlug === activeSlug
              ? [edge.sourceSlug]
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
    slug: string,
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
      slug,
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y,
      moved: false,
    };
    lastDragMovedRef.current = false;
    moveDraggedNode(slug, point.x, point.y, true);
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
      Math.abs(point.x - drag.startX) > 2 || Math.abs(point.y - drag.startY) > 2;
    drag.moved = drag.moved || moved;
    lastDragMovedRef.current = drag.moved;
    moveDraggedNode(drag.slug, point.x, point.y, false);
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
    slug: string,
    x: number,
    y: number,
    resetVelocity: boolean,
  ) {
    setNodeStates((current) =>
      current.map((node) => {
        if (node.slug === slug) {
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
    <div className="overflow-hidden rounded-[8px] border border-zinc-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]">
      {graph.edges.length === 0 ? (
        <div className="border-b border-zinc-100 px-4 py-3 text-sm text-zinc-500">
          Add [[post title]] references between posts to connect these nodes.
        </div>
      ) : null}
      <div ref={graphViewportRef} className="overscroll-contain">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
          role="img"
          aria-label="Second brain post graph"
          className="h-[520px] w-full cursor-grab select-none bg-[radial-gradient(circle_at_50%_45%,#f4f4f5_0,#fff_56%)] active:cursor-grabbing"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
          {graph.edges.map((edge, index) => {
            const source = nodeStatesBySlug.get(edge.sourceSlug);
            const target = nodeStatesBySlug.get(edge.targetSlug);
            if (!source || !target) {
              return null;
            }

            const active =
              !activeSlug ||
              edge.sourceSlug === activeSlug ||
              edge.targetSlug === activeSlug;

            return (
              <line
                key={`${edge.sourceSlug}-${edge.targetSlug}-${edge.label}-${index}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                className="transition"
                stroke={active ? "#52525b" : "#d4d4d8"}
                strokeWidth={active ? 0.85 : 0.5}
                strokeLinecap="round"
                opacity={active ? 0.48 : 0.34}
              />
            );
          })}

          {nodeStates.map((node) => {
            const active =
              !activeSlug ||
              activeSlug === node.slug ||
              connectedSlugs?.has(node.slug);
            const href = buildPublicPostPath(username, node.slug);

            return (
              <g
                key={node.slug}
                role="link"
                tabIndex={0}
                aria-label={`Open ${node.title}`}
                onPointerDown={(event) =>
                  handleNodePointerDown(event, node.slug)
                }
                onPointerMove={handleNodePointerMove}
                onPointerUp={handleNodePointerUp}
                onPointerCancel={handleNodePointerUp}
                onClick={(event) => handleNodeClick(event, href)}
                onKeyDown={(event) => handleNodeKeyDown(event, href)}
                onMouseEnter={() => setActiveSlug(node.slug)}
                onMouseLeave={() => setActiveSlug(null)}
                onFocus={() => setActiveSlug(node.slug)}
                onBlur={() => setActiveSlug(null)}
                className="cursor-pointer outline-none"
              >
                <g className="transition">
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={18}
                    fill="transparent"
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={activeSlug === node.slug ? 7.5 : 5.6}
                    fill={activeSlug === node.slug ? "#18181b" : "#a1a1aa"}
                    opacity={active ? 0.96 : 0.56}
                    className="transition"
                  />
                  {showLabels ? (
                    <text
                      x={node.x}
                      y={node.y + 20}
                      textAnchor="middle"
                      paintOrder="stroke"
                      stroke="#ffffff"
                      strokeWidth={4}
                      strokeLinejoin="round"
                      className={cn(
                        "pointer-events-none text-[10px] font-medium transition",
                        active ? "fill-zinc-800" : "fill-zinc-500",
                      )}
                    >
                      {truncateNodeTitle(node.title)}
                    </text>
                  ) : null}
                </g>
              </g>
            );
          })}
        </g>
        </svg>
      </div>
    </div>
  );
}

function EmptyGraphState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[8px] border border-dashed border-zinc-300 bg-white px-5 py-6 text-sm text-zinc-500">
      <p className="font-semibold text-zinc-800">{title}</p>
      <p className="mt-2 leading-6">{description}</p>
    </div>
  );
}

function buildInitialGraphNodes(graph: PublicUserPostGraph): GraphNodeState[] {
  const density = Math.min(Math.max(graph.nodes.length, 1), 12) / 12;
  const radiusX = 150 + density * 70;
  const radiusY = 100 + density * 45;
  const degree = new Map<string, number>();

  graph.nodes.forEach((node) => degree.set(node.slug, 0));
  graph.edges.forEach((edge) => {
    degree.set(edge.sourceSlug, (degree.get(edge.sourceSlug) ?? 0) + 1);
    degree.set(edge.targetSlug, (degree.get(edge.targetSlug) ?? 0) + 1);
  });
  const sortedNodes = [...graph.nodes].sort(
    (a, b) => (degree.get(b.slug) ?? 0) - (degree.get(a.slug) ?? 0),
  );

  return sortedNodes.map((node, index) => {
    if (sortedNodes.length === 1) {
      return {
        slug: node.slug,
        title: node.title,
        x: GRAPH_CENTER_X,
        y: GRAPH_CENTER_Y,
        vx: 0,
        vy: 0,
      };
    }

    const angle = -Math.PI / 2 + (index / sortedNodes.length) * Math.PI * 2;
    const nodeDegree = degree.get(node.slug) ?? 0;
    const pullToCenter = Math.min(nodeDegree * 0.09, 0.36);

    return {
      slug: node.slug,
      title: node.title,
      x:
        GRAPH_CENTER_X +
        Math.cos(angle) * radiusX * (1 - pullToCenter) +
        deterministicJitter(node.slug, 18),
      y:
        GRAPH_CENTER_Y +
        Math.sin(angle) * radiusY * (1 - pullToCenter) +
        deterministicJitter(`${node.slug}:y`, 14),
      vx: 0,
      vy: 0,
    };
  });
}

function stepForceSimulation(
  nodes: GraphNodeState[],
  edges: PublicUserPostGraph["edges"],
  draggedSlug?: string,
) {
  if (nodes.length === 0) {
    return nodes;
  }

  const nextNodes = nodes.map((node) => ({ ...node }));
  const bySlug = new Map(nextNodes.map((node) => [node.slug, node] as const));

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

      if (first.slug !== draggedSlug) {
        first.vx -= fx;
        first.vy -= fy;
      }
      if (second.slug !== draggedSlug) {
        second.vx += fx;
        second.vy += fy;
      }
    }
  }

  for (const edge of edges) {
    const source = bySlug.get(edge.sourceSlug);
    const target = bySlug.get(edge.targetSlug);
    if (!source || !target) {
      continue;
    }

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
    const springStrength =
      source.slug === draggedSlug || target.slug === draggedSlug
        ? DRAG_LINK_FORCE
        : LINK_FORCE;
    const force = (distance - LINK_DISTANCE) * springStrength;
    const fx = (dx / distance) * force;
    const fy = (dy / distance) * force;

    if (source.slug !== draggedSlug) {
      source.vx += fx;
      source.vy += fy;
    }
    if (target.slug !== draggedSlug) {
      target.vx -= fx;
      target.vy -= fy;
    }
  }

  for (const node of nextNodes) {
    if (node.slug === draggedSlug) {
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
