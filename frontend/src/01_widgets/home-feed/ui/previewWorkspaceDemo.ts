import type {
  WorkspaceLogItem,
  WorkspaceTaskOutput,
  WorkspaceTodoItem,
  WorkspaceWorkItem,
} from "./data";
import type {
  WorkspaceLogLinkItem,
  WorkspaceTaskLinkItem,
  WorkspaceUiData,
} from "./workspaceTypes";

/** Guest Workspace preview only — not used as logged-in fallback mock. */
export const previewDemoRepository = {
  fullName: "kitae9999/openlog",
  caption: "A real session — work first, writing follows",
} as const;

export const previewTasks: WorkspaceWorkItem[] = [
  {
    id: "guest-preview",
    title: "Make guest preview sell the loop",
    description:
      "Replace the fake notes-app sample with one afternoon of real OpenLog work.",
    status: "doing",
    body: `## Context

The guest workspace preview looked like a tutorial for a notes app.
It listed features instead of showing how work becomes writing.

## Goal

- One session story: issue → decision → fix → draft
- English copy that matches the landing
- Leave empty space so it feels alive, not stuffed`,
  },
  {
    id: "workspace-switcher",
    title: "Wire workspace switcher to real IDs",
    description: "Drop mock workspace fallbacks for logged-in users.",
    status: "done",
    body: `## Context

Logged-in views still fell back to demo workspace IDs.

## Goal

- Load ManagedWorkspace[] from the API
- Persist active workspace in localStorage + cookie`,
  },
];

export const previewLogs: WorkspaceLogItem[] = [
  {
    id: "preview-fix",
    tone: "green",
    label: "Fix",
    kind: "FIX",
    title: "Rewrote preview around OpenLog itself",
    description:
      "One task, three logs, one draft — enough to read the loop without a feature laundry list.",
    meta: "Today 16:18 · openlog capture",
    commit: "c8f2a91",
    href: "/write",
    taskId: "guest-preview",
    branch: "feat/guest-preview",
  },
  {
    id: "preview-decision",
    tone: "blue",
    label: "Decision",
    kind: "DECISION",
    title: "Sell the loop, not the feature list",
    description:
      "Show issue → decision → fix → output in one afternoon. Skip dark mode and search demos.",
    meta: "Today 15:40 · openlog capture",
    commit: "b3e7d04",
    href: "/write",
    taskId: "guest-preview",
    branch: "feat/guest-preview",
  },
  {
    id: "preview-issue",
    tone: "amber",
    label: "Issue",
    kind: "ISSUE",
    status: "CLOSED",
    title: "Guest preview felt like a fake notes app",
    description:
      "Korean tutorial copy, mixed languages, and unrelated tasks. Nothing about work becoming a post.",
    meta: "Today 14:02 · openlog capture",
    href: "/write",
    taskId: "guest-preview",
    branch: "feat/guest-preview",
  },
  {
    id: "switcher-done",
    tone: "zinc",
    label: "Log",
    kind: "NOTE",
    title: "Switcher now uses API workspaces",
    description:
      "Active workspace syncs via localStorage and the openlog-active-workspace cookie.",
    meta: "Yesterday · from commit 9a1c4e2",
    commit: "9a1c4e2",
    href: "/write",
    taskId: "workspace-switcher",
    branch: "feat/workspace-switcher",
  },
];

export const previewTodos: WorkspaceTodoItem[] = [
  {
    id: "preview-todo-ship",
    title: "Ship guest preview copy",
    description: "from log",
    done: false,
    taskId: "guest-preview",
  },
  {
    id: "preview-todo-overlay",
    title: "Point overlay at the draft, not signup",
    description: "from decision",
    done: true,
    taskId: "guest-preview",
  },
];

export const previewMemories = [
  {
    title: "Work first. Writing follows.",
    description:
      "Capture the session; publish the post when the draft is ready.",
    source: "decision",
    reads: "12 reads",
  },
] as const;

export type PreviewMemory = (typeof previewMemories)[number];

export const previewOutputs: WorkspaceTaskOutput[] = [
  {
    id: "guest-preview-post",
    taskId: "guest-preview",
    taskIds: ["guest-preview"],
    logIds: ["preview-issue", "preview-decision", "preview-fix"],
    status: "draft",
    title: "Work first, writing follows",
    description: "from 3 logs",
    content: `## Summary

Guest preview should show one real afternoon: an issue, a decision, a fix, and a draft ready to publish — not a fake notes app.`,
    updatedLabel: "Today",
  },
];

export const previewTaskLinks: WorkspaceTaskLinkItem[] = [];

export const previewLogLinks: WorkspaceLogLinkItem[] = [
  {
    id: "preview-log-link-1",
    fromLogId: "preview-fix",
    toLogId: "preview-issue",
    relation: "FIXES",
  },
];

/** Shared mock workspace for guest preview + landing graph demo. */
export function getPreviewWorkspaceData(): WorkspaceUiData {
  return {
    workspaceId: "preview-demo",
    workspaceName: "openlog",
    repositoryFullName: previewDemoRepository.fullName,
    tasks: previewTasks,
    logs: previewLogs,
    todos: previewTodos,
    outputs: previewOutputs,
    taskLinks: previewTaskLinks,
    logLinks: previewLogLinks,
  };
}
