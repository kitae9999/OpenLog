"use client";

import { LogDetailView } from "@/pages/logs/ui/LogDetailView";
import {
  getLogById,
  workspaceLogs,
  workspaceWorkItems,
} from "@/entities/workspace/model/data";
import type { WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

const log =
  getLogById("turbopack-pnpm") ??
  workspaceLogs.find((item) => item.id === "turbopack-pnpm") ??
  workspaceLogs[0];

const workspaceData: WorkspaceUiData = {
  workspaceId: "e2e-workspace",
  workspaceName: "E2E Workspace",
  projects: [],
  repositoryFullName: null,
  tasks: workspaceWorkItems,
  logs: workspaceLogs,
  outputs: [],
  todos: [],
  taskLinks: [],
  logLinks: [],
  memories: [],
};

export default function LogDetailE2EPage() {
  return (
    <main className="mx-auto w-full max-w-[1180px] bg-zinc-50 px-4 py-6 sm:px-6">
      <div data-testid="log-detail">
        <LogDetailView
          log={log}
          workspaceData={workspaceData}
          assignTaskOverride={async () => ({ ok: true })}
          isLoggedIn
        />
      </div>
    </main>
  );
}
