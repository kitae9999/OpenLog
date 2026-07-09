"use client";

import { TaskDetailView } from "@/widgets/home-feed/ui/TaskDetailView";
import { workspaceWorkItems } from "@/widgets/home-feed/ui/data";

const task =
  workspaceWorkItems.find((item) => item.id === "workspace-view") ??
  workspaceWorkItems[0];

export default function TaskDetailE2EPage() {
  return (
    <main className="mx-auto w-full max-w-[1180px] bg-zinc-50 px-4 py-6 sm:px-6">
      <div data-testid="task-detail">
        <TaskDetailView task={task} isLoggedIn />
      </div>
    </main>
  );
}
