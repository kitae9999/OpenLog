"use client";

import { useRef } from "react";
import { cn } from "@/shared/lib/cn";
import { PreviewAgentWorkflowWidget } from "@/widgets/home-feed/ui/PreviewAgentWorkflowWidget";
import { PreviewWorkspaceDashboard } from "@/widgets/home-feed/ui/WorkspaceView";
import { usePreviewSessionReplay } from "@/widgets/home-feed/ui/usePreviewSessionReplay";

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
