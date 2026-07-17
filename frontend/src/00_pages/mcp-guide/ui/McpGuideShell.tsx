"use client";

import { type ReactNode } from "react";
import { Header } from "@/widgets/chrome/ui";
import { cn } from "@/shared/lib/cn";
import { useSidebarOpenState } from "@/shared/lib/useSidebarOpenState";
import { HomeSidebar } from "@/widgets/app-shell/ui/HomeFeedShell";
import { McpGuideView } from "@/pages/mcp-guide/ui/McpGuideView";
import type { ManagedWorkspace } from "@/entities/workspace/model/workspaceTypes";

export function McpGuideShell({
  isLoggedIn,
  profileImageUrl,
  profileHref,
  workspaces = [],
  footer,
}: {
  isLoggedIn: boolean;
  profileImageUrl?: string | null;
  profileHref?: string;
  workspaces?: ManagedWorkspace[];
  footer: ReactNode;
}) {
  const { isSidebarOpen, setIsSidebarOpen, closeSidebarIfMobile } = useSidebarOpenState();


  return (
    <div className="flex min-h-dvh flex-col bg-app text-zinc-950">
      <Header
        isLoggedIn={isLoggedIn}
        profileImageUrl={profileImageUrl}
        profileHref={profileHref}
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((current) => !current)}
      />

      <div className="relative flex flex-1 overflow-hidden border-b border-zinc-200/70">
        <button
          type="button"
          aria-label="Close navigation overlay"
          className={cn(
            "fixed bottom-0 left-[282px] right-0 top-16 z-30 bg-zinc-950/20 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
            isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setIsSidebarOpen(false)}
        />

        <HomeSidebar
          activeTab="workspace"
          isLoggedIn={isLoggedIn}
          workspaces={workspaces}
          isOpen={isSidebarOpen}
          settingsNav="mcp-guide"
          onNavigate={closeSidebarIfMobile}
        />

        <main
          className={cn(
            "min-w-0 flex-1 bg-app transition-[margin] duration-300 ease-out",
            isSidebarOpen ? "lg:ml-[282px]" : "lg:ml-0",
          )}
        >
          <section
            aria-label="MCP Guide"
            className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 xl:px-10"
          >
            <McpGuideView isLoggedIn={isLoggedIn} />
          </section>
        </main>
      </div>

      <div
        className={cn(
          "transition-[margin] duration-300 ease-out",
          isSidebarOpen ? "lg:ml-[282px]" : "lg:ml-0",
        )}
      >
        {footer}
      </div>
    </div>
  );
}
