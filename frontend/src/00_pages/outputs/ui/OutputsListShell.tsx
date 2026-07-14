"use client";

import type { ReactNode } from "react";
import type { WorkspaceOutputStatus } from "@/entities/workspace/model/data";
import { OutputsListView } from "@/pages/outputs/ui/OutputsListView";
import { OutputWorkspaceShell } from "@/widgets/app-shell/ui/OutputWorkspaceShell";
import type { ManagedWorkspace, WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

export function OutputsListShell({
  isLoggedIn,
  status,
  profileImageUrl,
  profileHref,
  workspaces = [],
  workspaceData,
  footer,
}: {
  isLoggedIn: boolean;
  status: WorkspaceOutputStatus;
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
      label="Outputs"
      workspaces={workspaces}
      workspaceData={workspaceData}
    >
      <OutputsListView
        isLoggedIn={isLoggedIn}
        status={status}
        workspaceData={workspaceData}
      />
    </OutputWorkspaceShell>
  );
}
