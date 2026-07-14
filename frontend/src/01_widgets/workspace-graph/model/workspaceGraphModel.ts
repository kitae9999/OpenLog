import {
  getLogHref,
  getOutputHref,
  getTaskHref,
  type WorkspaceLogItem,
  type WorkspaceTaskOutput,
  type WorkspaceWorkItem,
} from "@/entities/workspace/model/data";
import type { WorkspaceMemoryItem, WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

export type WorkspaceGraphNodeKind = "task" | "log" | "output" | "memory";

export type WorkspaceGraphNode = {
  id: string;
  kind: WorkspaceGraphNodeKind;
  title: string;
  description: string;
  href: string;
  taskId?: string;
};

export type WorkspaceGraphEdge = {
  sourceId: string;
  targetId: string;
  label: string;
};

export type WorkspaceGraph = {
  nodes: WorkspaceGraphNode[];
  edges: WorkspaceGraphEdge[];
};

/** Stable key for node/edge membership — ignores title/description churn. */
export function getWorkspaceGraphTopologyKey(graph: WorkspaceGraph): string {
  const nodeIds = graph.nodes.map((node) => node.id).sort().join("|");
  const edgeIds = graph.edges
    .map((edge) => `${edge.sourceId}>${edge.targetId}`)
    .sort()
    .join("|");
  return `${nodeIds}::${edgeIds}`;
}

export function buildWorkspaceGraph({
  tasks,
  logs,
  outputs,
  taskLinks,
  logLinks,
  crossLinks,
  memories,
  includeMemories = true,
}: {
  tasks: WorkspaceWorkItem[];
  logs: WorkspaceLogItem[];
  outputs: WorkspaceTaskOutput[];
  taskLinks: WorkspaceUiData["taskLinks"];
  logLinks: WorkspaceUiData["logLinks"];
  crossLinks: WorkspaceUiData["crossLinks"];
  memories: WorkspaceMemoryItem[];
  includeMemories?: boolean;
}): WorkspaceGraph {
  const memoryNodes = includeMemories
    ? memories.map((memory) => ({
        id: getMemoryNodeId(memory.id),
        kind: "memory" as const,
        title: memory.title,
        description: memory.excerpt,
        href: `/memory/${memory.id}`,
        taskId: memory.task?.id,
      }))
    : [];

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
    ...memoryNodes,
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

  for (const link of crossLinks ?? []) {
    edges.push({
      sourceId: getNodeId(link.fromType, link.fromNodeId),
      targetId: getNodeId(link.toType, link.toNodeId),
      label: link.relation.toLowerCase().replaceAll("_", " "),
    });
  }

  if (includeMemories) {
    memories.forEach((memory) => {
      if (memory.originLog) {
        edges.push({ sourceId: getLogNodeId(memory.originLog.id), targetId: getMemoryNodeId(memory.id), label: "remembered" });
      }
      if (memory.task) {
        edges.push({ sourceId: getTaskNodeId(memory.task.id), targetId: getMemoryNodeId(memory.id), label: "context" });
      }
    });
  }

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

export function getTaskNodeId(taskId: string) {
  return `task:${taskId}`;
}

export function getLogNodeId(logId: string) {
  return `log:${logId}`;
}

export function getOutputNodeId(outputId: string) {
  return `output:${outputId}`;
}

export function getMemoryNodeId(memoryId: string) {
  return `memory:${memoryId}`;
}

export function getNodeId(kind: WorkspaceGraphNodeKind, nodeId: string) {
  if (kind === "task") return getTaskNodeId(nodeId);
  if (kind === "log") return getLogNodeId(nodeId);
  if (kind === "output") return getOutputNodeId(nodeId);
  return getMemoryNodeId(nodeId);
}

export function getNodeFill(kind: WorkspaceGraphNodeKind, focused = false) {
  if (kind === "task") {
    return focused ? "#18181b" : "#27272a";
  }
  if (kind === "output") {
    return focused ? "#1d4ed8" : "#3b82f6";
  }
  if (kind === "memory") {
    return "#ffffff";
  }

  return focused ? "#52525b" : "#a1a1aa";
}

export function getNodeRadius(kind: WorkspaceGraphNodeKind, focused = false) {
  if (kind === "task") {
    return focused ? 10.5 : 8.5;
  }
  if (kind === "output") {
    return focused ? 8 : 6.5;
  }
  if (kind === "memory") {
    return focused ? 7.5 : 6;
  }

  return focused ? 7 : 5.5;
}

export function getNodeStroke(kind: WorkspaceGraphNodeKind, focused = false) {
  if (kind === "memory") {
    return focused ? "#27272a" : "#a1a1aa";
  }
  if (kind === "output") {
    return focused ? "#1e40af" : "#2563eb";
  }
  if (kind === "task") {
    return focused ? "#09090b" : "#18181b";
  }

  return focused ? "#3f3f46" : "#71717a";
}

function getTaskNodeDescription(
  task: WorkspaceWorkItem,
  logs: WorkspaceLogItem[],
) {
  const logCount = logs.filter((log) => log.taskId === task.id).length;

  return `${task.status} · ${logCount} log${logCount === 1 ? "" : "s"}`;
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
