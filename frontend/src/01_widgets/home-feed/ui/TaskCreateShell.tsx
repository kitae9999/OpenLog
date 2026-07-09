"use client";

import type { ReactNode } from "react";
import { OutputWorkspaceShell } from "./OutputWorkspaceShell";
import { TaskCreateView } from "./TaskCreateView";
import type { WorkspaceUiData } from "./workspaceTypes";

export function TaskCreateShell({
  isLoggedIn,
  profileImageUrl,
  profileHref,
  workspaceData,
  footer,
}: {
  isLoggedIn: boolean;
  profileImageUrl?: string | null;
  profileHref?: string;
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
      workspaceData={workspaceData}
    >
      <TaskCreateView isLoggedIn={isLoggedIn} workspaceData={workspaceData} />
    </OutputWorkspaceShell>
  );
}
