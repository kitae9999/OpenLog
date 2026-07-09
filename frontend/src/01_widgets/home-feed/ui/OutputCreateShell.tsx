"use client";

import type { ReactNode } from "react";
import { OutputCreateView } from "./OutputCreateView";
import { OutputWorkspaceShell } from "./OutputWorkspaceShell";
import type { WorkspaceUiData } from "./workspaceTypes";

export function OutputCreateShell({
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
      label="New output"
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
