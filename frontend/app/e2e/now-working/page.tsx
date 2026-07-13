"use client";

import { WorkspaceView } from "@/widgets/home-feed/ui/WorkspaceView";
import type { WorkspaceUiData } from "@/widgets/home-feed/ui/workspaceTypes";

const workspaceData: WorkspaceUiData = {
  workspaceId: "e2e-now-working",
  workspaceName: "Agent Context",
  repositoryFullName: "openlog/openlog",
  tasks: [
    {
      id: "task-now-working",
      title: "Redesign the working-context dashboard",
      description: "Turn the dashboard into a durable agent handoff.",
      status: "doing",
      apiStatus: "DOING",
      body: "",
    },
  ],
  logs: [
    {
      id: "context-current",
      tone: "zinc",
      label: "Note",
      kind: "NOTE",
      status: "NONE",
      title: "Refined the agent handoff",
      description:
        "The agent has connected the active branch and task, and is now refining how conversational context should read as a handoff.",
      meta: "Today 16:40 · agent context",
      href: "/logs/context-current",
      taskId: "task-now-working",
      branch: "feature/agent-context",
      createdAt: "2026-07-13T16:40:00",
    },
    {
      id: "context-last-work",
      tone: "green",
      label: "Fix",
      kind: "FIX",
      status: "CLOSED",
      title: "Removed diff-centric actions",
      description:
        "The diff action was removed and the latest work was condensed into a readable sentence.",
      meta: "Today 16:18 · agent context",
      commit: "a1b2c3d",
      href: "/logs/context-last-work",
      taskId: "task-now-working",
      branch: "feature/agent-context",
      createdAt: "2026-07-13T16:18:00",
    },
    {
      id: "context-concern",
      tone: "amber",
      label: "Issue",
      kind: "ISSUE",
      status: "OPEN",
      title: "Separate context updates from logs",
      description:
        "The remaining question is how agent-written context updates should persist independently from formal logs.",
      meta: "Today 16:02 · agent context",
      href: "/logs/context-concern",
      taskId: "task-now-working",
      branch: "feature/agent-context",
      createdAt: "2026-07-13T16:02:00",
    },
  ],
  outputs: [],
  todos: [],
  taskLinks: [],
  logLinks: [],
  memories: [],
};

export default function NowWorkingE2EPage() {
  return (
    <main className="mx-auto max-w-[1080px] px-6 py-8">
      <WorkspaceView isLoggedIn workspaceData={workspaceData} />
    </main>
  );
}
