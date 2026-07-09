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
};

export type ManagedWorkspace = {
  id: string;
  slug: string;
  name: string;
  repoFullName: string | null;
};
