"use client";

import type { ReactNode } from "react";
import type { WorkspaceOutputStatus } from "./data";
import { OutputsListView } from "./OutputsListView";
import { OutputWorkspaceShell } from "./OutputWorkspaceShell";
import type { WorkspaceUiData } from "./workspaceTypes";

export function OutputsListShell({
  isLoggedIn,
  status,
  profileImageUrl,
  profileHref,
  workspaceData,
  footer,
}: {
  isLoggedIn: boolean;
  status: WorkspaceOutputStatus;
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
      label="Outputs"
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
