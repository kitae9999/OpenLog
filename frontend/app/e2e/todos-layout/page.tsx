"use client";

import { useMemo, useState } from "react";
import { WorkspaceView } from "@/widgets/workspace-dashboard/ui/WorkspaceView";
import type { WorkspaceTodoItem } from "@/entities/workspace/model/data";
import type { WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

const baseFixture: Omit<WorkspaceUiData, "todos"> = {
  workspaceId: "e2e-workspace",
  workspaceName: "E2E Workspace",
  repositoryFullName: null,
  tasks: [],
  logs: [],
  outputs: [],
  taskLinks: [],
  logLinks: [],
  memories: [],
};

const initialTodos: WorkspaceTodoItem[] = [
  { id: "1", title: "ㅇㅁㄴㅇㅁㄴ", done: false },
  { id: "2", title: "dsa", done: false },
  { id: "3", title: "align check", done: false },
];

export default function TodosLayoutE2EPage() {
  const [todos, setTodos] = useState(initialTodos);
  const workspaceData = useMemo(
    () => ({
      ...baseFixture,
      todos,
    }),
    [todos],
  );

  return (
    <main className="mx-auto max-w-md p-6">
      <WorkspaceView
        isLoggedIn
        workspaceData={workspaceData}
        createTodoOverride={async (title) => {
          const id = String(Date.now());
          setTodos((current) => [...current, { id, title, done: false }]);
          return { ok: true, id };
        }}
      />
    </main>
  );
}
