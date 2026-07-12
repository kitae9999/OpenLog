import { ActivityView } from "@/widgets/home-feed/ui/ActivityView";
import { MemoryListView } from "@/widgets/home-feed/ui/MemoryViews";
import type { WorkspaceActivity, WorkspaceUiData } from "@/widgets/home-feed/ui/workspaceTypes";

const workspaceData: WorkspaceUiData = {
  workspaceId: "e2e-workspace",
  workspaceName: "E2E Workspace",
  repositoryFullName: null,
  tasks: [{ id: "task-1", title: "Ship memory", description: null, status: "doing", apiStatus: "DOING", body: "" }],
  logs: [],
  outputs: [],
  todos: [],
  taskLinks: [],
  logLinks: [],
  memories: [{
    id: "memory-1",
    title: "Keep project context durable",
    content: "## Rule\nCapture why a decision was made.",
    excerpt: "Rule Capture why a decision was made.",
    task: { id: "task-1", title: "Ship memory" },
    originLog: { id: "log-1", title: "Memory decision" },
    createdAt: "2026-07-12T09:00:00",
    updatedAt: "2026-07-13T09:00:00",
  }],
};

const activity: WorkspaceActivity = {
  from: "2026-07-07",
  to: "2026-07-13",
  totalLogCount: 5,
  days: [0, 1, 0, 3, 0, 1, 0].map((logCount, index) => ({
    date: `2026-07-${String(index + 7).padStart(2, "0")}`,
    logCount,
  })),
};

export default function MemoryActivityFixturePage() {
  return (
    <main className="mx-auto max-w-[1080px] space-y-16 px-6 py-8">
      <MemoryListView workspaceData={workspaceData} />
      <ActivityView
        activity={activity}
        selectedDate="2026-07-10"
        selectedLogs={[{
          id: "log-1",
          tone: "blue",
          label: "Decision",
          title: "Memory decision",
          description: "Keep durable context attached to the workspace.",
          meta: "Jul 10",
          href: "/logs/log-1",
          createdAt: "2026-07-10T12:00:00",
        }]}
      />
    </main>
  );
}
