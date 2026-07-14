import type {
  WorkspaceLogItem,
  WorkspaceTaskOutput,
  WorkspaceTodoItem,
  WorkspaceWorkItem,
} from "@/entities/workspace/model/data";

export type WorkspaceTaskLinkItem = {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  relation: "PRECEDES" | "BLOCKS" | "RELATES_TO";
};

export type WorkspaceLogLinkItem = {
  id: string;
  fromLogId: string;
  toLogId: string;
  relation: "FIXES" | "RELATES_TO" | "SUPERSEDES";
};

export type WorkspaceNodeKind = "task" | "log" | "output" | "memory";

export type WorkspaceCrossLinkRelation =
  | "RELATES_TO"
  | "REFERENCES"
  | "SUPPORTS"
  | "DERIVED_FROM";

export type WorkspaceCrossLinkItem = {
  id: string;
  fromType: WorkspaceNodeKind;
  fromNodeId: string;
  toType: WorkspaceNodeKind;
  toNodeId: string;
  relation: WorkspaceCrossLinkRelation;
};

/** Agent-pushed “where we are” brief — not a log. Latest one wins. */
export type WorkspaceWorkingBrief = {
  title: string;
  prose: string;
  taskId?: string;
  taskTitle?: string;
  branch?: string;
  /** Short clock / relative label, e.g. "14:02" or "12m ago". */
  updatedLabel?: string;
};

export type WorkspaceUiData = {
  workspaceId: string;
  workspaceName: string;
  repositoryFullName: string | null;
  tasks: WorkspaceWorkItem[];
  logs: WorkspaceLogItem[];
  outputs: WorkspaceTaskOutput[];
  todos: WorkspaceTodoItem[];
  taskLinks: WorkspaceTaskLinkItem[];
  logLinks: WorkspaceLogLinkItem[];
  crossLinks?: WorkspaceCrossLinkItem[];
  memories: WorkspaceMemoryItem[];
  /** Optional until a dedicated API exists; UI may also derive from task + logs. */
  workingBrief?: WorkspaceWorkingBrief | null;
};

export type WorkspaceMemoryItem = {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  task: { id: string; title: string } | null;
  originLog: { id: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceActivityDay = {
  date: string;
  logCount: number;
};

export type WorkspaceActivity = {
  from: string;
  to: string;
  totalLogCount: number;
  days: WorkspaceActivityDay[];
};

export type ManagedWorkspace = {
  id: string;
  slug: string;
  name: string;
  repoFullName: string | null;
};
