"use client";

import type { ReactNode } from "react";
import { LogCreateView } from "./LogCreateView";
import { OutputWorkspaceShell } from "./OutputWorkspaceShell";
import type { WorkspaceUiData } from "./workspaceTypes";

export function LogCreateShell({
  isLoggedIn,
  taskId,
  profileImageUrl,
  profileHref,
  workspaceData,
  footer,
}: {
  isLoggedIn: boolean;
  taskId?: string;
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
      label="New log"
      workspaceNav="logs"
      workspaceData={workspaceData}
    >
      <LogCreateView
        isLoggedIn={isLoggedIn}
        initialTaskId={taskId}
        workspaceData={workspaceData}
      />
    </OutputWorkspaceShell>
  );
}
