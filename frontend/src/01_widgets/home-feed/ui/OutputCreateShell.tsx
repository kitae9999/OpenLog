"use client";

import type { ReactNode } from "react";
import { OutputCreateView } from "./OutputCreateView";
import { OutputWorkspaceShell } from "./OutputWorkspaceShell";
import type { ManagedWorkspace, WorkspaceUiData } from "./workspaceTypes";

export function OutputCreateShell({
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
      label="New output"
      workspaces={workspaces}
      workspaceData={workspaceData}
    >
      <OutputCreateView
        isLoggedIn={isLoggedIn}
        initialTaskId={taskId}
        workspaceData={workspaceData}
      />
    </OutputWorkspaceShell>
  );
}
