import { OutputCreateView } from "@/pages/outputs/ui/OutputCreateView";
import { OutputDetailView } from "@/pages/outputs/ui/OutputDetailView";
import type { WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

const workspaceData: WorkspaceUiData = {
  workspaceId: "100",
  workspaceName: "Output lifecycle fixture",
  repositoryFullName: null,
  projects: [],
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
      createdAt: "2026-07-16T10:00:00",
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
      createdAt: "2026-07-15T10:00:00",
    },
  ],
  outputs: [
    {
      id: "50",
      taskId: "10",
      title: "Exported output",
      description: "Source kept after creating a post draft",
      content: "The copied source remains immutable.",
      status: "exported",
      taskIds: ["10"],
      logIds: ["30"],
      updatedLabel: "today",
      linkedPostId: "90",
      linkedPostStatus: "draft",
      postEditHref: "/posts/90/edit",
    },
  ],
  todos: [],
  taskLinks: [],
  logLinks: [],
  memories: [],
};

export default function OutputPostLifecycleFixturePage() {
  return (
    <main className="mx-auto max-w-[1080px] space-y-20 px-4 py-8 sm:px-6">
      <section aria-label="Blank output creation fixture">
        <OutputCreateView isLoggedIn workspaceData={workspaceData} />
      </section>

      <section aria-label="Locked output fixture">
        <OutputDetailView
          isLoggedIn
          outputId="50"
          output={workspaceData.outputs[0]}
          workspaceData={workspaceData}
        />
      </section>
    </main>
  );
}
