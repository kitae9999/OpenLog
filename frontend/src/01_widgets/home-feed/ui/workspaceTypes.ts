import type {
  WorkspaceLogItem,
  WorkspaceTaskOutput,
  WorkspaceTodoItem,
  WorkspaceWorkItem,
} from "./data";

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
  memories: WorkspaceMemoryItem[];
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
