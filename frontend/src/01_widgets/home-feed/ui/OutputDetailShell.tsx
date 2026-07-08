"use client";

import type { ReactNode } from "react";
import { OutputDetailView } from "./OutputDetailView";
import { OutputWorkspaceShell } from "./OutputWorkspaceShell";

export function OutputDetailShell({
  isLoggedIn,
  outputId,
  profileImageUrl,
  profileHref,
  footer,
}: {
  isLoggedIn: boolean;
  outputId: string;
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
    >
      <OutputDetailView isLoggedIn={isLoggedIn} outputId={outputId} />
    </OutputWorkspaceShell>
  );
}
