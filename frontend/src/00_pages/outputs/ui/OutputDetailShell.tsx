"use client";

import type { ReactNode } from "react";
import type { WorkspaceTaskOutput } from "@/entities/workspace/model/data";
import { OutputDetailView } from "@/pages/outputs/ui/OutputDetailView";
import { OutputWorkspaceShell } from "@/widgets/app-shell/ui/OutputWorkspaceShell";
import type { ManagedWorkspace, WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

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
