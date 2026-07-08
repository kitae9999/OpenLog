"use client";

import type { ReactNode } from "react";
import type { WorkspaceOutputStatus } from "./data";
import { OutputsListView } from "./OutputsListView";
import { OutputWorkspaceShell } from "./OutputWorkspaceShell";

export function OutputsListShell({
  isLoggedIn,
  status,
  profileImageUrl,
  profileHref,
  footer,
}: {
  isLoggedIn: boolean;
  status: WorkspaceOutputStatus;
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
      label="Outputs"
    >
      <OutputsListView isLoggedIn={isLoggedIn} status={status} />
    </OutputWorkspaceShell>
  );
}
