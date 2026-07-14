import { WorkspaceLinkManager } from "@/features/workspace-links/ui/WorkspaceLinkManager";
import type { WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

const workspaceData: WorkspaceUiData = {
  workspaceId: "e2e-workspace",
  workspaceName: "E2E Workspace",
  projects: [],
  repositoryFullName: null,
  tasks: [
    {
      id: "task-1",
      title: "Ship cross links",
      description: "Connect every workspace document type.",
      status: "doing",
      apiStatus: "DOING",
      body: "",
    },
  ],
  logs: [
    {
      id: "log-1",
      tone: "blue",
      label: "Decision",
      title: "Use explicit graph edges",
      description: "Persist manual relationships.",
      meta: "Today",
      href: "/logs/log-1",
    },
  ],
  outputs: [
    {
      id: "output-1",
      taskId: "task-1",
      taskIds: ["task-1"],
      logIds: [],
      status: "draft",
      title: "Cross-link design",
      description: "from workspace documents",
      content: "",
      updatedLabel: "Today",
    },
  ],
  todos: [],
  taskLinks: [],
  logLinks: [],
  crossLinks: [
    {
      id: "cross-1",
      fromType: "task",
      fromNodeId: "task-1",
      toType: "memory",
      toNodeId: "memory-1",
      relation: "SUPPORTS",
    },
  ],
  memories: [
    {
      id: "memory-1",
      title: "Graph model decision",
      content: "Manual cross-type links are first-class edges.",
      excerpt: "Manual cross-type links are first-class edges.",
      task: null,
      originLog: null,
      createdAt: "2026-07-13T12:00:00",
      updatedAt: "2026-07-13T12:00:00",
    },
  ],
};

export default function CrossLinksFixturePage() {
  return (
    <main className="mx-auto max-w-[920px] px-6 py-10">
      <WorkspaceLinkManager workspaceData={workspaceData} />
    </main>
  );
}
