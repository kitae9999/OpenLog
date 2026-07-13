"use client";

import type { ReactNode } from "react";
import { OutputWorkspaceShell } from "./OutputWorkspaceShell";
import { TaskCreateView } from "./TaskCreateView";
import type { ManagedWorkspace, WorkspaceUiData } from "./workspaceTypes";

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
