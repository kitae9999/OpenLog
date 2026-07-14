import type {
  WorkspaceLogItem,
  WorkspaceTaskOutput,
  WorkspaceTodoItem,
  WorkspaceWorkItem,
} from "@/entities/workspace/model/data";
import {
  previewLogs,
  previewMemories,
  previewOutputs,
  previewTasks,
  previewTodos,
  type PreviewMemory,
} from "@/widgets/workspace-preview/model/previewWorkspaceDemo";
import type {
  WorkspaceLogLinkItem,
  WorkspaceTaskLinkItem,
  WorkspaceUiData,
  WorkspaceWorkingBrief,
} from "@/entities/workspace/model/workspaceTypes";

export type PreviewReplayStepId =
  | "boot"
  | "chat"
  | "task"
  | "issue"
  | "link"
  | "decision"
  | "fix"
  | "draft"
  | "complete";

/** Orca-style top stage pills — focus moves as the demo advances. */
export const PREVIEW_STAGE_PILLS = [
  { id: "launch", label: "Launch Claude Code" },
  { id: "chat", label: "Work in the session" },
  { id: "task", label: "Open a task" },
  { id: "capture", label: "Capture a log" },
  { id: "link", label: "Link to the task" },
] as const;

export type PreviewStageId = (typeof PREVIEW_STAGE_PILLS)[number]["id"];

const PREVIEW_STAGE_ORDER: readonly PreviewStageId[] =
  PREVIEW_STAGE_PILLS.map((pill) => pill.id);

function previewStageIndex(stageId: PreviewStageId): number {
  return PREVIEW_STAGE_ORDER.indexOf(stageId);
}

export function getPreviewStageId(
  stepId: PreviewReplayStepId,
): PreviewStageId {
  switch (stepId) {
    case "boot":
      return "launch";
    case "chat":
      return "chat";
    case "task":
      return "task";
    case "issue":
    case "decision":
    case "fix":
    case "draft":
      return "capture";
    case "link":
    case "complete":
      return "link";
  }
}

/** Stage pills only move forward within a playback pass. */
export function advancePreviewStageId(
  current: PreviewStageId,
  next: PreviewStageId,
): PreviewStageId {
  return previewStageIndex(next) >= previewStageIndex(current) ? next : current;
}

export type PreviewReplayHighlight =
  | { kind: "none" }
  | { kind: "task"; id: string }
  | { kind: "log"; id: string }
  | { kind: "todo"; id: string }
  | { kind: "memory" }
  | { kind: "output"; id: string }
  | { kind: "graph" };

export type PreviewCursorTarget =
  | "none"
  | "prompt"
  | "task"
  | "logs"
  | "output"
  | "graph"
  | "todos";

export type PreviewAgentLineKind =
  | "banner"
  | "user"
  | "thought"
  | "tool"
  | "result"
  | "ok"
  | "status";

export type PreviewAgentLine = {
  id: string;
  kind: PreviewAgentLineKind;
  text: string;
  detail?: string;
};

export type PreviewWorkspaceVisible = {
  taskIds: string[];
  logIds: string[];
  todoIds: string[];
  memory: boolean;
  outputIds: string[];
  closeIssue?: boolean;
  /** When false, issue log exists but is not yet linked to a task. */
  linkIssueToTask?: boolean;
};

export type PreviewDemoEvent =
  | {
      type: "type_shell";
      text: string;
      msPerChar: number;
      clock: string;
    }
  | {
      type: "type_prompt";
      id: string;
      text: string;
      msPerChar: number;
      clock: string;
    }
  | {
      type: "agent_line";
      lineId: string;
      holdMs: number;
      clock: string;
      agentStatus: string;
      cursor?: PreviewCursorTarget;
      stepId?: PreviewReplayStepId;
    }
  | {
      type: "workspace";
      stepId: PreviewReplayStepId;
      holdMs: number;
      clock: string;
      caption: string;
      agentStatus: string;
      highlight: PreviewReplayHighlight;
      cursor: PreviewCursorTarget;
      visible: PreviewWorkspaceVisible;
      showCta?: boolean;
    };

/** Demo pre-allocates final rail counts so the browser does not grow per item. */
export const PREVIEW_RESERVED_COUNTS = {
  tasks: 2,
  logs: 4,
  todos: 2,
  output: 1,
  memory: 1,
} as const;

export type SyncFillZone =
  | "logs"
  | "tasks"
  | "todos"
  | "output"
  | "memory";

export type SyncFillState = {
  status: "idle" | "fetching" | "filling" | "settled";
  zone?: SyncFillZone;
  reserved: {
    tasks: number;
    logs: number;
    todos: number;
    output: number;
    memory: number;
  };
  /** Among empty rails in the active zone, which one pulses (usually 0). */
  pendingSlotIndex?: number;
  /** Ids that should play enter animation this frame. */
  incomingIds: string[];
};

export type PreviewReplaySnapshot = {
  stepId: PreviewReplayStepId;
  stageId: PreviewStageId;
  caption: string;
  clock: string;
  agentName: string;
  agentModel: string;
  agentStatus: string;
  /** Shell command currently being typed (`claude`). */
  shellText: string;
  shellComplete: boolean;
  /** Chronological transcript after the shell line (banner, user, tools…). */
  agentLines: PreviewAgentLine[];
  /** True while a user prompt is mid-type. */
  promptTyping: boolean;
  cursorTarget: PreviewCursorTarget;
  tasks: WorkspaceWorkItem[];
  logs: WorkspaceLogItem[];
  todos: WorkspaceTodoItem[];
  memories: PreviewMemory[];
  outputs: WorkspaceTaskOutput[];
  taskLinks: WorkspaceTaskLinkItem[];
  logLinks: WorkspaceLogLinkItem[];
  /** Agent-pushed status brief for Now Working (Status Brief). */
  workingBrief: WorkspaceWorkingBrief | null;
  highlight: PreviewReplayHighlight;
  showCta: boolean;
  /** Fetching → reserved-slot fill (demo + product-shaped). */
  syncFill: SyncFillState;
};

/** Terminal lines that mean “browser is about to receive a sync”. */
const SYNC_INTENT_BY_LINE: Record<
  string,
  { zone: SyncFillZone; incomingIds: string[] }
> = {
  "tool-task": { zone: "tasks", incomingIds: ["guest-preview"] },
  "ok-task": { zone: "tasks", incomingIds: ["guest-preview"] },
  "tool-issue": { zone: "logs", incomingIds: ["preview-issue"] },
  "ok-issue": { zone: "logs", incomingIds: ["preview-issue"] },
  "tool-decision": { zone: "logs", incomingIds: ["preview-decision"] },
  "ok-decision": { zone: "logs", incomingIds: ["preview-decision"] },
  "tool-fix": {
    zone: "logs",
    incomingIds: ["preview-fix", "preview-todo-overlay"],
  },
  "ok-fix": {
    zone: "logs",
    incomingIds: ["preview-fix", "preview-todo-overlay"],
  },
  "tool-draft": {
    zone: "output",
    incomingIds: ["guest-preview-post", "preview-todo-ship", "memory"],
  },
  "ok-draft": {
    zone: "output",
    incomingIds: ["guest-preview-post", "preview-todo-ship", "memory"],
  },
  done: {
    zone: "tasks",
    incomingIds: ["workspace-switcher", "switcher-done"],
  },
};

const guestTask = previewTasks.find((task) => task.id === "guest-preview")!;
const switcherTask = previewTasks.find(
  (task) => task.id === "workspace-switcher",
)!;

const issueLog = previewLogs.find((log) => log.id === "preview-issue")!;
const decisionLog = previewLogs.find((log) => log.id === "preview-decision")!;
const fixLog = previewLogs.find((log) => log.id === "preview-fix")!;
const switcherLog = previewLogs.find((log) => log.id === "switcher-done")!;

export const PREVIEW_SHELL_COMMAND = "claude";

/** First user turn — kept for reduced-motion / legacy imports. */
export const PREVIEW_USER_PROMPT =
  "guest preview still feels like a notes-app tutorial. can you look at the preview widget?";

/**
 * Terminal transcript lines — conversational Claude Code session with OpenLog MCP.
 */
export const PREVIEW_AGENT_LINES: PreviewAgentLine[] = [
  {
    id: "banner",
    kind: "banner",
    text: "Claude Code",
    detail: "Fable · OpenLog MCP",
  },
  {
    id: "thought-read",
    kind: "thought",
    text: "I'll read the guest preview widget first.",
  },
  {
    id: "tool-read",
    kind: "tool",
    text: "Read",
    detail: "frontend/src/…/PreviewAgentWorkflowWidget.tsx",
  },
  {
    id: "ok-read",
    kind: "result",
    text: "Read 480 lines",
  },
  {
    id: "reply-1",
    kind: "status",
    text: "Yeah — it still sells a feature list. Want me to sketch a rewrite around one real session?",
  },
  {
    id: "reply-task",
    kind: "status",
    text: "Got it. I'll create a task with the OpenLog MCP.",
  },
  {
    id: "tool-task",
    kind: "tool",
    text: "mcp__openlog__task_create",
    detail: 'title: "Make guest preview sell the loop"',
  },
  {
    id: "ok-task",
    kind: "result",
    text: "Created task guest-preview · status doing",
  },
  {
    id: "thought-code",
    kind: "thought",
    text: "Task is open. Continuing on the rewrite…",
  },
  {
    id: "tool-edit",
    kind: "tool",
    text: "Edit",
    detail: "frontend/src/…/previewWorkspaceDemo.ts",
  },
  {
    id: "ok-edit",
    kind: "result",
    text: "Updated demo copy around the work→writing loop",
  },
  {
    id: "ask-log",
    kind: "status",
    text: "I'll capture this as an issue log. Link it to a task?",
  },
  {
    id: "reply-link-yes",
    kind: "status",
    text: "Okay — I'll list tasks and attach the right one.",
  },
  {
    id: "tool-task-list",
    kind: "tool",
    text: "mcp__openlog__task_list",
    detail: 'status: "doing"',
  },
  {
    id: "ok-task-list",
    kind: "result",
    text: "1 doing · Make guest preview sell the loop",
  },
  {
    id: "thought-pick",
    kind: "thought",
    text: "That's the one we just opened. Linking the issue to it.",
  },
  {
    id: "tool-issue",
    kind: "tool",
    text: "mcp__openlog__log_capture",
    detail: 'kind: "issue", task: "guest-preview"',
  },
  {
    id: "ok-issue",
    kind: "result",
    text: "Captured issue · linked to guest-preview",
  },
  {
    id: "thought-decision",
    kind: "thought",
    text: "Logging the decision so the draft has a through-line.",
  },
  {
    id: "tool-decision",
    kind: "tool",
    text: "mcp__openlog__log_capture",
    detail: 'kind: "decision", task: "guest-preview"',
  },
  {
    id: "ok-decision",
    kind: "result",
    text: "Logged decision · sell the loop, not the feature list",
  },
  {
    id: "tool-fix",
    kind: "tool",
    text: "mcp__openlog__log_capture",
    detail: 'kind: "fix", task: "guest-preview", closes: "preview-issue"',
  },
  {
    id: "ok-fix",
    kind: "result",
    text: "Fix linked · issue closed",
  },
  {
    id: "tool-draft",
    kind: "tool",
    text: "mcp__openlog__output_draft",
    detail: 'from: "3 logs"',
  },
  {
    id: "ok-draft",
    kind: "ok",
    text: "Draft ready · Work first, writing follows",
  },
  {
    id: "done",
    kind: "status",
    text: "Session is in OpenLog. Open the workspace when you want to publish.",
  },
];

const USER_PROMPTS: Record<string, string> = {
  "user-1": PREVIEW_USER_PROMPT,
  "user-2": "let's open a new task for this",
  "user-3": "yes, link it",
};

const agentLineById = new Map(
  PREVIEW_AGENT_LINES.map((line) => [line.id, line] as const),
);

/**
 * Conversational demo: shell → chat → user asks for a task → MCP create →
 * capture log → ask to link → list tasks → link → more captures → draft.
 */
export const PREVIEW_DEMO_EVENTS: readonly PreviewDemoEvent[] = [
  {
    type: "type_shell",
    text: PREVIEW_SHELL_COMMAND,
    msPerChar: 110,
    clock: "13:57",
  },
  {
    type: "agent_line",
    lineId: "banner",
    holdMs: 1200,
    clock: "13:57",
    agentStatus: "Ready",
    cursor: "none",
    stepId: "boot",
  },
  {
    type: "type_prompt",
    id: "user-1",
    text: USER_PROMPTS["user-1"]!,
    msPerChar: 36,
    clock: "13:58",
  },
  {
    type: "agent_line",
    lineId: "thought-read",
    holdMs: 1200,
    clock: "13:59",
    agentStatus: "Thinking",
    cursor: "none",
    stepId: "chat",
  },
  {
    type: "agent_line",
    lineId: "tool-read",
    holdMs: 1100,
    clock: "13:59",
    agentStatus: "Running",
  },
  {
    type: "agent_line",
    lineId: "ok-read",
    holdMs: 800,
    clock: "13:59",
    agentStatus: "Running",
  },
  {
    type: "agent_line",
    lineId: "reply-1",
    holdMs: 1800,
    clock: "14:00",
    agentStatus: "Waiting",
    stepId: "chat",
  },
  {
    type: "type_prompt",
    id: "user-2",
    text: USER_PROMPTS["user-2"]!,
    msPerChar: 40,
    clock: "14:01",
  },
  {
    type: "agent_line",
    lineId: "reply-task",
    holdMs: 1600,
    clock: "14:01",
    agentStatus: "Thinking",
    cursor: "task",
    stepId: "task",
  },
  {
    type: "agent_line",
    lineId: "tool-task",
    holdMs: 1100,
    clock: "14:02",
    agentStatus: "Running",
    cursor: "task",
  },
  {
    type: "agent_line",
    lineId: "ok-task",
    holdMs: 1100,
    clock: "14:02",
    agentStatus: "Running",
    cursor: "task",
  },
  {
    type: "workspace",
    stepId: "task",
    holdMs: 2000,
    clock: "14:02",
    caption: "",
    agentStatus: "Working",
    highlight: { kind: "task", id: "guest-preview" },
    cursor: "task",
    visible: {
      taskIds: ["guest-preview"],
      logIds: [],
      todoIds: [],
      memory: false,
      outputIds: [],
    },
  },
  {
    type: "agent_line",
    lineId: "thought-code",
    holdMs: 1200,
    clock: "14:05",
    agentStatus: "Thinking",
    // Keep stage on task — do not rewind the status bar to chat.
  },
  {
    type: "agent_line",
    lineId: "tool-edit",
    holdMs: 1100,
    clock: "14:06",
    agentStatus: "Running",
  },
  {
    type: "agent_line",
    lineId: "ok-edit",
    holdMs: 900,
    clock: "14:06",
    agentStatus: "Running",
  },
  {
    type: "agent_line",
    lineId: "ask-log",
    holdMs: 2000,
    clock: "14:08",
    agentStatus: "Waiting",
    cursor: "logs",
    stepId: "issue",
  },
  {
    type: "type_prompt",
    id: "user-3",
    text: USER_PROMPTS["user-3"]!,
    msPerChar: 55,
    clock: "14:09",
  },
  {
    type: "agent_line",
    lineId: "reply-link-yes",
    holdMs: 1400,
    clock: "14:09",
    agentStatus: "Thinking",
    cursor: "logs",
    stepId: "link",
  },
  {
    type: "agent_line",
    lineId: "tool-task-list",
    holdMs: 1100,
    clock: "14:09",
    agentStatus: "Running",
    cursor: "task",
  },
  {
    type: "agent_line",
    lineId: "ok-task-list",
    holdMs: 1000,
    clock: "14:09",
    agentStatus: "Running",
    cursor: "task",
  },
  {
    type: "agent_line",
    lineId: "thought-pick",
    holdMs: 1300,
    clock: "14:10",
    agentStatus: "Thinking",
    cursor: "logs",
  },
  {
    type: "agent_line",
    lineId: "tool-issue",
    holdMs: 1200,
    clock: "14:10",
    agentStatus: "Running",
    cursor: "logs",
  },
  {
    type: "agent_line",
    lineId: "ok-issue",
    holdMs: 1100,
    clock: "14:10",
    agentStatus: "Running",
    cursor: "logs",
  },
  {
    type: "workspace",
    stepId: "link",
    holdMs: 2200,
    clock: "14:10",
    caption: "",
    agentStatus: "Capturing",
    highlight: { kind: "log", id: "preview-issue" },
    cursor: "logs",
    visible: {
      taskIds: ["guest-preview"],
      logIds: ["preview-issue"],
      todoIds: [],
      memory: false,
      outputIds: [],
      linkIssueToTask: true,
    },
  },
  {
    type: "agent_line",
    lineId: "thought-decision",
    holdMs: 1300,
    clock: "15:40",
    agentStatus: "Thinking",
    cursor: "logs",
    stepId: "decision",
  },
  {
    type: "agent_line",
    lineId: "tool-decision",
    holdMs: 1100,
    clock: "15:40",
    agentStatus: "Running",
    cursor: "logs",
  },
  {
    type: "agent_line",
    lineId: "ok-decision",
    holdMs: 1100,
    clock: "15:40",
    agentStatus: "Running",
    cursor: "logs",
  },
  {
    type: "workspace",
    stepId: "decision",
    holdMs: 2000,
    clock: "15:40",
    caption: "",
    agentStatus: "Capturing",
    highlight: { kind: "log", id: "preview-decision" },
    cursor: "logs",
    visible: {
      taskIds: ["guest-preview"],
      logIds: ["preview-issue", "preview-decision"],
      todoIds: [],
      memory: false,
      outputIds: [],
      linkIssueToTask: true,
    },
  },
  {
    type: "agent_line",
    lineId: "tool-fix",
    holdMs: 1100,
    clock: "16:18",
    agentStatus: "Running",
    cursor: "logs",
    stepId: "fix",
  },
  {
    type: "agent_line",
    lineId: "ok-fix",
    holdMs: 1100,
    clock: "16:18",
    agentStatus: "Running",
    cursor: "graph",
  },
  {
    type: "workspace",
    stepId: "fix",
    holdMs: 2200,
    clock: "16:18",
    caption: "",
    agentStatus: "Linking",
    highlight: { kind: "log", id: "preview-fix" },
    cursor: "graph",
    visible: {
      taskIds: ["guest-preview"],
      logIds: ["preview-issue", "preview-decision", "preview-fix"],
      todoIds: ["preview-todo-overlay"],
      memory: false,
      outputIds: [],
      closeIssue: true,
      linkIssueToTask: true,
    },
  },
  {
    type: "agent_line",
    lineId: "tool-draft",
    holdMs: 1200,
    clock: "16:22",
    agentStatus: "Running",
    cursor: "output",
    stepId: "draft",
  },
  {
    type: "agent_line",
    lineId: "ok-draft",
    holdMs: 1200,
    clock: "16:22",
    agentStatus: "Drafting",
    cursor: "output",
  },
  {
    type: "workspace",
    stepId: "draft",
    holdMs: 2400,
    clock: "16:22",
    caption: "",
    agentStatus: "Drafting",
    highlight: { kind: "output", id: "guest-preview-post" },
    cursor: "output",
    visible: {
      taskIds: ["guest-preview"],
      logIds: ["preview-issue", "preview-decision", "preview-fix"],
      todoIds: ["preview-todo-overlay", "preview-todo-ship"],
      memory: true,
      outputIds: ["guest-preview-post"],
      closeIssue: true,
      linkIssueToTask: true,
    },
  },
  {
    type: "agent_line",
    lineId: "done",
    holdMs: 1400,
    clock: "16:23",
    agentStatus: "Done",
    cursor: "graph",
  },
  {
    type: "workspace",
    stepId: "complete",
    holdMs: 2200,
    clock: "16:23",
    caption: "",
    agentStatus: "Done",
    highlight: { kind: "graph" },
    cursor: "none",
    showCta: false,
    visible: {
      taskIds: ["guest-preview", "workspace-switcher"],
      logIds: [
        "preview-issue",
        "preview-decision",
        "preview-fix",
        "switcher-done",
      ],
      todoIds: ["preview-todo-overlay", "preview-todo-ship"],
      memory: true,
      outputIds: ["guest-preview-post"],
      closeIssue: true,
      linkIssueToTask: true,
    },
  },
] as const;

const EMPTY_VISIBLE: PreviewWorkspaceVisible = {
  taskIds: [],
  logIds: [],
  todoIds: [],
  memory: false,
  outputIds: [],
};

const taskById = new Map<string, WorkspaceWorkItem>([
  [guestTask.id, guestTask],
  [switcherTask.id, switcherTask],
]);

const logById = new Map<string, WorkspaceLogItem>([
  [issueLog.id, withAgentMeta(issueLog, "14:10")],
  [decisionLog.id, withAgentMeta(decisionLog, "15:40")],
  [fixLog.id, withAgentMeta(fixLog, "16:18")],
  [switcherLog.id, withAgentMeta(switcherLog, "Yesterday")],
]);

const todoById = new Map(
  previewTodos.map((todo) => [todo.id, todo] as const),
);

const outputById = new Map(
  previewOutputs.map((output) => [output.id, output] as const),
);

function withAgentMeta(
  log: WorkspaceLogItem,
  clock: string,
): WorkspaceLogItem {
  return {
    ...log,
    meta: `${clock} · via claude · MCP`,
  };
}

export const PREVIEW_DEMO_EVENT_COUNT = PREVIEW_DEMO_EVENTS.length;
export const PREVIEW_REPLAY_FINAL_EVENT_INDEX = PREVIEW_DEMO_EVENTS.length - 1;
export const PREVIEW_REPLAY_STEPS = PREVIEW_DEMO_EVENTS;
export const PREVIEW_REPLAY_FINAL_STEP_INDEX = PREVIEW_REPLAY_FINAL_EVENT_INDEX;

function buildWorkspaceSlice(visible: PreviewWorkspaceVisible) {
  const closeIssue = Boolean(visible.closeIssue);
  const linkIssue = visible.linkIssueToTask !== false;

  const tasks = visible.taskIds
    .map((id) => taskById.get(id))
    .filter((task): task is WorkspaceWorkItem => Boolean(task));

  const logs = visible.logIds
    .map((id) => {
      const log = logById.get(id);
      if (!log) {
        return null;
      }
      if (log.id === "preview-issue") {
        return {
          ...log,
          status: closeIssue ? ("CLOSED" as const) : ("OPEN" as const),
          taskId: linkIssue ? log.taskId : undefined,
        };
      }
      return log;
    })
    .filter((log): log is WorkspaceLogItem => Boolean(log))
    .reverse();

  const todos = visible.todoIds
    .map((id) => todoById.get(id))
    .filter((todo): todo is WorkspaceTodoItem => Boolean(todo));

  const memories = visible.memory ? [...previewMemories] : [];

  const outputs = visible.outputIds
    .map((id) => outputById.get(id))
    .filter((output): output is WorkspaceTaskOutput => Boolean(output));

  const logLinks =
    closeIssue && visible.logIds.includes("preview-fix")
      ? [
          {
            id: "preview-log-link-1",
            fromLogId: "preview-fix",
            toLogId: "preview-issue",
            relation: "FIXES" as const,
          },
        ]
      : [];

  return { tasks, logs, todos, memories, outputs, logLinks };
}

/** Evolve the Now Working brief as the demo session progresses. */
function buildWorkingBrief(
  visible: PreviewWorkspaceVisible,
  clock: string,
): WorkspaceWorkingBrief | null {
  if (!visible.taskIds.includes("guest-preview")) {
    return null;
  }

  const hasIssue = visible.logIds.includes("preview-issue");
  const hasDecision = visible.logIds.includes("preview-decision");
  const hasFix = visible.logIds.includes("preview-fix");
  const hasDraft = visible.outputIds.includes("guest-preview-post");

  let prose: string;
  if (hasDraft) {
    prose =
      "Draft is ready — Work first, writing follows. Guest preview now shows one real afternoon instead of a feature list. Switcher cleanup is parked for later.";
  } else if (hasFix) {
    prose =
      "Rewrote the preview around OpenLog itself: one task, three logs, one draft. Overlay should point at the draft, not signup. Draft is next.";
  } else if (hasDecision) {
    prose =
      "Locked the story: issue → decision → fix → draft in one afternoon. Skipping dark mode and search demos. Writing the rewrite now.";
  } else if (hasIssue) {
    prose =
      "Named the problem — guest preview still reads like a fake notes app. Issue is captured and linked. Next: decide what this afternoon's story should be.";
  } else {
    prose =
      "Started the guest preview rewrite. Selling the work→writing loop instead of a notes-app tutorial. Still deciding how much empty space to leave so it feels alive.";
  }

  return {
    title: guestTask.title,
    prose,
    taskId: guestTask.id,
    taskTitle: guestTask.title,
    branch: "feat/guest-preview",
    updatedLabel: clock,
  };
}

export type PreviewDemoPlaybackState = {
  eventIndex: number;
  typedChars: number;
};

export function getPreviewReplaySnapshot(
  playback: PreviewDemoPlaybackState | number,
): PreviewReplaySnapshot {
  const state: PreviewDemoPlaybackState =
    typeof playback === "number"
      ? { eventIndex: playback, typedChars: Number.POSITIVE_INFINITY }
      : playback;

  const eventIndex = Math.min(
    Math.max(state.eventIndex, 0),
    PREVIEW_REPLAY_FINAL_EVENT_INDEX,
  );

  let shellText = "";
  let shellComplete = false;
  let promptTyping = false;
  const transcript: PreviewAgentLine[] = [];
  let visible = EMPTY_VISIBLE;
  let stepId: PreviewReplayStepId = "boot";
  let stageId: PreviewStageId = "launch";
  let caption = "";
  let clock = "13:57";
  let agentStatus = "Ready";
  let highlight: PreviewReplayHighlight = { kind: "none" };
  let cursorTarget: PreviewCursorTarget = "none";
  let syncFill: SyncFillState = {
    status: "idle",
    reserved: { ...PREVIEW_RESERVED_COUNTS },
    incomingIds: [],
  };
  /** Last committed workspace visible — used to detect filling deltas. */
  let previousVisible = EMPTY_VISIBLE;
  let lastWorkspaceIncoming: string[] = [];

  for (let i = 0; i <= eventIndex; i += 1) {
    const event = PREVIEW_DEMO_EVENTS[i]!;
    const isCurrent = i === eventIndex;

    if (event.type === "type_shell") {
      clock = event.clock;
      agentStatus = "Shell";
      cursorTarget = "none";
      caption = "";
      if (isCurrent) {
        syncFill = {
          status: "idle",
          reserved: { ...PREVIEW_RESERVED_COUNTS },
          incomingIds: [],
        };
        const count = Math.min(
          event.text.length,
          Number.isFinite(state.typedChars)
            ? Math.max(0, Math.floor(state.typedChars))
            : event.text.length,
        );
        shellText = event.text.slice(0, count);
        shellComplete = count >= event.text.length;
      } else {
        shellText = event.text;
        shellComplete = true;
      }
      continue;
    }

    if (event.type === "type_prompt") {
      clock = event.clock;
      agentStatus = "Waiting";
      cursorTarget = "prompt";
      caption = "";
      shellText = PREVIEW_SHELL_COMMAND;
      shellComplete = true;
      if (isCurrent) {
        syncFill = {
          status: "idle",
          reserved: { ...PREVIEW_RESERVED_COUNTS },
          incomingIds: [],
        };
      }

      const fullText = event.text;
      if (isCurrent) {
        const count = Math.min(
          fullText.length,
          Number.isFinite(state.typedChars)
            ? Math.max(0, Math.floor(state.typedChars))
            : fullText.length,
        );
        promptTyping = count < fullText.length;
        transcript.push({
          id: event.id,
          kind: "user",
          text: fullText.slice(0, count),
        });
      } else {
        transcript.push({
          id: event.id,
          kind: "user",
          text: fullText,
        });
      }
      continue;
    }

    if (event.type === "agent_line") {
      clock = event.clock;
      agentStatus = event.agentStatus;
      shellText = PREVIEW_SHELL_COMMAND;
      shellComplete = true;
      if (event.cursor) {
        cursorTarget = event.cursor;
      }
      if (event.stepId) {
        stepId = event.stepId;
        stageId = advancePreviewStageId(stageId, getPreviewStageId(stepId));
      }
      const line = agentLineById.get(event.lineId);
      if (line && !transcript.some((item) => item.id === line.id)) {
        transcript.push(line);
      }

      const intent = SYNC_INTENT_BY_LINE[event.lineId];
      if (intent) {
        // Fetching while tool/ok is on screen and before the matching workspace commit.
        // Keep intended ids so secondary zones (e.g. todos) can pulse their next rail.
        if (isCurrent) {
          syncFill = {
            status: "fetching",
            zone: intent.zone,
            reserved: { ...PREVIEW_RESERVED_COUNTS },
            pendingSlotIndex: 0,
            incomingIds: intent.incomingIds,
          };
        }
      } else if (isCurrent) {
        syncFill = {
          status: "idle",
          reserved: { ...PREVIEW_RESERVED_COUNTS },
          incomingIds: [],
        };
      }
      continue;
    }

    // workspace commit
    const incomingIds = diffIncomingIds(previousVisible, event.visible);
    previousVisible = event.visible;
    lastWorkspaceIncoming = incomingIds;

    clock = event.clock;
    agentStatus = event.agentStatus;
    stepId = event.stepId;
    stageId = advancePreviewStageId(stageId, getPreviewStageId(stepId));
    caption = event.caption;
    highlight = event.highlight;
    cursorTarget = event.cursor;
    visible = event.visible;
    shellText = PREVIEW_SHELL_COMMAND;
    shellComplete = true;

    if (isCurrent) {
      syncFill = {
        status: incomingIds.length > 0 ? "filling" : "settled",
        zone: zoneForIncoming(incomingIds, event.highlight),
        reserved: { ...PREVIEW_RESERVED_COUNTS },
        incomingIds,
      };
    }
  }

  if (eventIndex > 0 && !shellText) {
    shellText = PREVIEW_SHELL_COMMAND;
    shellComplete = true;
  }

  const slice = buildWorkspaceSlice(visible);
  const workingBrief = buildWorkingBrief(visible, clock);

  // After a workspace commit, keep incomingIds briefly for enter animation;
  // when we have moved past that event, clear to settled/idle.
  const currentEvent = PREVIEW_DEMO_EVENTS[eventIndex];
  if (currentEvent?.type !== "workspace" && syncFill.status !== "fetching") {
    if (
      lastWorkspaceIncoming.length > 0 &&
      currentEvent?.type === "agent_line" &&
      !SYNC_INTENT_BY_LINE[currentEvent.lineId]
    ) {
      syncFill = {
        status: "settled",
        reserved: { ...PREVIEW_RESERVED_COUNTS },
        incomingIds: [],
      };
    }
  }

  // Brief updates with every workspace commit that touches the active task.
  if (
    currentEvent?.type === "workspace" &&
    workingBrief &&
    syncFill.status === "filling" &&
    !syncFill.incomingIds.includes("working-brief")
  ) {
    syncFill = {
      ...syncFill,
      incomingIds: [...syncFill.incomingIds, "working-brief"],
    };
  }

  return {
    stepId,
    stageId,
    caption,
    clock,
    agentName: "Claude Code",
    agentModel: "",
    agentStatus,
    shellText,
    shellComplete,
    agentLines: transcript,
    promptTyping,
    cursorTarget,
    tasks: slice.tasks,
    logs: slice.logs,
    todos: slice.todos,
    memories: slice.memories,
    outputs: slice.outputs,
    taskLinks: [],
    logLinks: slice.logLinks,
    workingBrief,
    highlight,
    showCta: false,
    syncFill,
  };
}

function diffIncomingIds(
  previous: PreviewWorkspaceVisible,
  next: PreviewWorkspaceVisible,
): string[] {
  const incoming: string[] = [];
  for (const id of next.taskIds) {
    if (!previous.taskIds.includes(id)) {
      incoming.push(id);
    }
  }
  for (const id of next.logIds) {
    if (!previous.logIds.includes(id)) {
      incoming.push(id);
    }
  }
  for (const id of next.todoIds) {
    if (!previous.todoIds.includes(id)) {
      incoming.push(id);
    }
  }
  for (const id of next.outputIds) {
    if (!previous.outputIds.includes(id)) {
      incoming.push(id);
    }
  }
  if (next.memory && !previous.memory) {
    incoming.push("memory");
  }
  return incoming;
}

function zoneForIncoming(
  incomingIds: string[],
  highlight: PreviewReplayHighlight,
): SyncFillZone | undefined {
  if (highlight.kind === "log") {
    return "logs";
  }
  if (highlight.kind === "task") {
    return "tasks";
  }
  if (highlight.kind === "todo") {
    return "todos";
  }
  if (highlight.kind === "output") {
    return "output";
  }
  if (highlight.kind === "memory") {
    return "memory";
  }
  if (incomingIds.some((id) => id.startsWith("preview-") && id.includes("todo"))) {
    return "todos";
  }
  if (incomingIds.some((id) => id.includes("log") || id.startsWith("preview-") || id === "switcher-done")) {
    if (incomingIds.some((id) => id.includes("todo"))) {
      return "todos";
    }
    if (incomingIds.some((id) => id.includes("post") || id.includes("output"))) {
      return "output";
    }
    if (incomingIds.includes("memory")) {
      return "memory";
    }
    if (
      incomingIds.some(
        (id) =>
          id === "preview-issue" ||
          id === "preview-decision" ||
          id === "preview-fix" ||
          id === "switcher-done",
      )
    ) {
      return "logs";
    }
  }
  if (
    incomingIds.some(
      (id) => id === "guest-preview" || id === "workspace-switcher",
    )
  ) {
    return "tasks";
  }
  return undefined;
}

export function getPreviewReplayWorkspaceData(
  snapshot: PreviewReplaySnapshot,
): WorkspaceUiData {
  return {
    workspaceId: "preview-demo",
    workspaceName: "openlog",
    repositoryFullName: "kitae9999/openlog",
    tasks: snapshot.tasks,
    logs: snapshot.logs,
    todos: snapshot.todos,
    outputs: snapshot.outputs,
    taskLinks: snapshot.taskLinks,
    logLinks: snapshot.logLinks,
    memories: snapshot.memories.map((memory, index) => ({
      id: `preview-${index}`,
      title: memory.title,
      content: memory.description,
      excerpt: memory.description,
      task: null,
      originLog: null,
      createdAt: "2026-07-13T12:00:00",
      updatedAt: "2026-07-13T12:00:00",
    })),
    workingBrief: snapshot.workingBrief,
  };
}

export function isPreviewHighlight(
  highlight: PreviewReplayHighlight,
  kind: PreviewReplayHighlight["kind"],
  id?: string,
) {
  if (highlight.kind !== kind) {
    return false;
  }
  if (kind === "none" || kind === "memory" || kind === "graph") {
    return true;
  }
  return "id" in highlight && highlight.id === id;
}

export function getEventHoldMs(eventIndex: number): number {
  const event = PREVIEW_DEMO_EVENTS[eventIndex];
  if (!event) {
    return 0;
  }
  if (event.type === "type_shell" || event.type === "type_prompt") {
    return event.text.length * event.msPerChar + 500;
  }
  return event.holdMs;
}

/** First event index where the demo enters the given stage pill. */
export function getPreviewStageStartEventIndex(
  stageId: PreviewStageId,
): number {
  if (stageId === "launch") {
    return 0;
  }

  let stepId: PreviewReplayStepId = "boot";
  let currentStage: PreviewStageId = "launch";

  for (let i = 0; i < PREVIEW_DEMO_EVENTS.length; i += 1) {
    const event = PREVIEW_DEMO_EVENTS[i]!;

    if (event.type === "agent_line" && event.stepId) {
      stepId = event.stepId;
      currentStage = advancePreviewStageId(
        currentStage,
        getPreviewStageId(stepId),
      );
    } else if (event.type === "workspace") {
      stepId = event.stepId;
      currentStage = advancePreviewStageId(
        currentStage,
        getPreviewStageId(stepId),
      );
    }

    if (currentStage === stageId) {
      return i;
    }
  }

  return 0;
}
