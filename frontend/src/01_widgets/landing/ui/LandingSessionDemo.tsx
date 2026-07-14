"use client";

import { useRef } from "react";
import { cn } from "@/shared/lib/cn";
import { PreviewAgentWorkflowWidget } from "@/widgets/workspace-preview/ui/PreviewAgentWorkflowWidget";
import { PreviewWorkspaceDashboard } from "@/widgets/workspace-dashboard/ui/WorkspaceView";
import { usePreviewSessionReplay } from "@/widgets/workspace-preview/model/usePreviewSessionReplay";

export function LandingSessionDemo({ className }: { className?: string }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const replay = usePreviewSessionReplay(true, rootRef);

  return (
    <section
      ref={rootRef}
      aria-label="OpenLog session demo"
      className={cn("relative", className)}
    >
      <PreviewAgentWorkflowWidget
        replay={replay}
        workspace={
          <PreviewWorkspaceDashboard replaySnapshot={replay.snapshot} />
        }
      />
    </section>
  );
}
