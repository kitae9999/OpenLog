import { PlannerView } from "@/widgets/home-feed/ui/PlannerView";
import type { WorkspaceUiData } from "@/widgets/home-feed/ui/workspaceTypes";

const workspaceData: WorkspaceUiData = {
  workspaceId: "e2e-workspace",
  workspaceName: "E2E Workspace",
  repositoryFullName: null,
  tasks: [
    {
      id: "task-1",
      title: "Ship planner",
      description: null,
      status: "doing",
      apiStatus: "DOING",
      body: "",
    },
  ],
  logs: [],
  outputs: [],
  todos: [],
  taskLinks: [],
  logLinks: [],
  memories: [],
};

export default function PlannerFixturePage() {
  return (
    <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6">
      <PlannerView
        month="2026-07"
        selectedDate="2026-07-10"
        todos={[
          {
            id: "todo-1",
            title: "Connect planner API",
            done: false,
            taskId: "task-1",
            plannedFor: "2026-07-10",
          },
          {
            id: "todo-2",
            title: "Verify mobile calendar",
            done: true,
            plannedFor: "2026-07-10",
          },
        ]}
        workspaceData={workspaceData}
      />
    </main>
  );
}
