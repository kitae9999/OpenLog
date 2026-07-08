"use client";

import type { ReactNode } from "react";
import { OutputCreateView } from "./OutputCreateView";
import { OutputWorkspaceShell } from "./OutputWorkspaceShell";

export function OutputCreateShell({
  isLoggedIn,
  taskId,
  profileImageUrl,
  profileHref,
  footer,
}: {
  isLoggedIn: boolean;
  taskId?: string;
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
      label="New output"
    >
      <OutputCreateView isLoggedIn={isLoggedIn} initialTaskId={taskId} />
    </OutputWorkspaceShell>
  );
}
