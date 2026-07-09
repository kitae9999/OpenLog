"use client";

import type { ReactNode } from "react";
import type { WorkspaceTaskOutput } from "./data";
import { OutputDetailView } from "./OutputDetailView";
import { OutputWorkspaceShell } from "./OutputWorkspaceShell";
import type { ManagedWorkspace, WorkspaceUiData } from "./workspaceTypes";

export function OutputDetailShell({
  isLoggedIn,
  outputId,
  output,
  workspaces = [],
  workspaceData,
  profileImageUrl,
  profileHref,
  footer,
}: {
  isLoggedIn: boolean;
  outputId: string;
  output?: WorkspaceTaskOutput;
  workspaces?: ManagedWorkspace[];
  workspaceData?: WorkspaceUiData | null;
  profileImageUrl?: string | null;
  profileHref?: string;
  footer: ReactNode;
}) {
  return (
    <OutputWorkspaceShell
      isLoggedIn={isLoggedIn}
      profileImageUrl={profileImageUrl}
      profileHref={profileHref}
      footer={footer}
      label="Output detail"
      workspaces={workspaces}
      workspaceData={workspaceData}
    >
      <OutputDetailView
        isLoggedIn={isLoggedIn}
        outputId={outputId}
        output={output}
        workspaceData={workspaceData}
      />
    </OutputWorkspaceShell>
  );
}
