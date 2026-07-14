"use client";

import type { ReactNode } from "react";
import { LogCreateView } from "@/pages/logs/ui/LogCreateView";
import { OutputWorkspaceShell } from "@/widgets/app-shell/ui/OutputWorkspaceShell";
import type { ManagedWorkspace, WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

export function LogCreateShell({
  isLoggedIn,
  taskId,
  profileImageUrl,
  profileHref,
  workspaces = [],
  workspaceData,
  footer,
}: {
  isLoggedIn: boolean;
  taskId?: string;
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
      label="New log"
      workspaceNav="logs"
      workspaces={workspaces}
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
