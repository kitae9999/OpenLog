"use client";

import type { ReactNode } from "react";
import { OutputWorkspaceShell } from "@/widgets/app-shell/ui/OutputWorkspaceShell";
import { TaskCreateView } from "@/pages/tasks/ui/TaskCreateView";
import type { ManagedWorkspace, WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

export function TaskCreateShell({
  isLoggedIn,
  profileImageUrl,
  profileHref,
  workspaces = [],
  workspaceData,
  footer,
}: {
  isLoggedIn: boolean;
  profileImageUrl?: string | null;
  profileHref?: string;
  workspaces?: ManagedWorkspace[];
  workspaceData?: WorkspaceUiData | null;
  footer: ReactNode;
}) {
  return (
    <OutputWorkspaceShell
      isLoggedIn={isLoggedIn}
      profileImageUrl={profileImageUrl}
      profileHref={profileHref}
      footer={footer}
      label="New task"
      workspaceNav="tasks"
      workspaces={workspaces}
      workspaceData={workspaceData}
    >
      <TaskCreateView isLoggedIn={isLoggedIn} workspaceData={workspaceData} />
    </OutputWorkspaceShell>
  );
}
