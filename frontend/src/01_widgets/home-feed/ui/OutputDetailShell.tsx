"use client";

import type { ReactNode } from "react";
import type { WorkspaceTaskOutput } from "./data";
import { OutputDetailView } from "./OutputDetailView";
import { OutputWorkspaceShell } from "./OutputWorkspaceShell";
import type { WorkspaceUiData } from "./workspaceTypes";

export function OutputDetailShell({
  isLoggedIn,
  outputId,
  output,
  workspaceData,
  profileImageUrl,
  profileHref,
  footer,
}: {
  isLoggedIn: boolean;
  outputId: string;
  output?: WorkspaceTaskOutput;
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
