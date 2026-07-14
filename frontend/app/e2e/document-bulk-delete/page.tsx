import { Suspense } from "react";
import { LogsListView } from "@/pages/logs/ui/LogsListView";
import { MemoryListView } from "@/pages/memory/ui/MemoryViews";
import { OutputsListView } from "@/pages/outputs/ui/OutputsListView";
import { TasksListView } from "@/pages/tasks/ui/TasksListView";
import type { WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

const workspaceData: WorkspaceUiData = {
  workspaceId: "100",
  workspaceName: "Bulk delete fixture",
  repositoryFullName: null,
  tasks: [
    {
      id: "10",
      title: "First task",
      description: "First task description",
      status: "doing",
      apiStatus: "DOING",
      body: "First task body",
    },
    {
      id: "20",
      title: "Second task",
      description: "Second task description",
      status: "todo",
      apiStatus: "TODO",
      body: "Second task body",
    },
  ],
  logs: [
    {
      id: "30",
      tone: "amber",
      label: "Issue",
      kind: "ISSUE",
      status: "OPEN",
      title: "First log",
      description: "First log description",
      meta: "Today · main",
      href: "/logs/30",
      taskId: "10",
      body: "First log body",
      createdAt: "2026-07-13T10:00:00",
    },
    {
      id: "40",
      tone: "blue",
      label: "Decision",
      kind: "DECISION",
      status: "NONE",
      title: "Second log",
      description: "Second log description",
      meta: "Yesterday · main",
      href: "/logs/40",
      body: "Second log body",
      createdAt: "2026-07-12T10:00:00",
    },
  ],
  outputs: [
    {
      id: "50",
      taskId: "10",
      title: "First output",
      description: "First output description",
      content: "First output body",
      status: "draft",
      taskIds: ["10"],
      logIds: ["30"],
      updatedLabel: "today",
    },
    {
      id: "60",
      taskId: "20",
      title: "Second output",
      description: "Second output description",
      content: "Second output body",
      status: "draft",
      taskIds: ["20"],
      logIds: ["40"],
      updatedLabel: "yesterday",
    },
  ],
  todos: [],
  taskLinks: [],
  logLinks: [],
  memories: [
    {
      id: "70",
      title: "First memory",
      content: "First memory body",
      excerpt: "First memory excerpt",
      task: { id: "10", title: "First task" },
      originLog: null,
      createdAt: "2026-07-12T09:00:00",
      updatedAt: "2026-07-13T09:00:00",
    },
    {
      id: "80",
      title: "Second memory",
      content: "Second memory body",
      excerpt: "Second memory excerpt",
      task: null,
      originLog: { id: "40", title: "Second log" },
      createdAt: "2026-07-11T09:00:00",
      updatedAt: "2026-07-12T09:00:00",
    },
  ],
};

export default function DocumentBulkDeleteFixturePage() {
  return (
    <main className="mx-auto max-w-[1080px] space-y-16 px-4 py-8 sm:px-6">
      <section aria-label="Tasks bulk fixture">
        <TasksListView isLoggedIn workspaceData={workspaceData} />
      </section>
      <section aria-label="Logs bulk fixture">
        <Suspense fallback={<p>Loading logs...</p>}>
          <LogsListView
            isLoggedIn
            typeFilter="all"
            workspaceData={workspaceData}
          />
        </Suspense>
      </section>
      <section aria-label="Outputs bulk fixture">
        <OutputsListView
          isLoggedIn
          status="draft"
          workspaceData={workspaceData}
        />
      </section>
      <section aria-label="Memory bulk fixture">
        <MemoryListView workspaceData={workspaceData} />
      </section>
    </main>
  );
}
