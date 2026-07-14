"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Header } from "@/widgets/chrome/ui";
import { cn } from "@/shared/lib/cn";
import type { WorkspaceLogItem } from "@/entities/workspace/model/data";
import { LogDetailView } from "@/pages/logs/ui/LogDetailView";
import { HomeSidebar } from "@/widgets/app-shell/ui/HomeFeedShell";
import { mergeLogWithOverrides } from "@/features/document-overrides/model/logOverrides";
import type { ManagedWorkspace, WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

export function LogDetailShell({
  log: initialLog,
  workspaces = [],
  workspaceData,
  isLoggedIn,
  profileImageUrl,
  profileHref,
  footer,
}: {
  logId: string;
  log: WorkspaceLogItem;
  workspaces?: ManagedWorkspace[];
  workspaceData?: WorkspaceUiData | null;
  isLoggedIn: boolean;
  profileImageUrl?: string | null;
  profileHref?: string;
  footer: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const log = workspaceData ? initialLog : mergeLogWithOverrides(initialLog);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");

    function syncSidebar(event: MediaQueryList | MediaQueryListEvent) {
      setIsSidebarOpen(event.matches);
    }

    syncSidebar(query);
    query.addEventListener("change", syncSidebar);

    return () => {
      query.removeEventListener("change", syncSidebar);
    };
  }, []);

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
          workspaceNav="logs"
          isLoggedIn={isLoggedIn}
          isOpen={isSidebarOpen}
          workspaces={workspaces}
          workspaceData={workspaceData}
          onNavigate={() => {
            if (!window.matchMedia("(min-width: 1024px)").matches) {
              setIsSidebarOpen(false);
            }
          }}
        />

        <main
          className={cn(
            "min-w-0 flex-1 bg-app transition-[margin] duration-300 ease-out",
            isSidebarOpen ? "lg:ml-[282px]" : "lg:ml-0",
          )}
        >
          <section
            aria-label="Log detail"
            className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 xl:px-10"
          >
            <LogDetailView
              log={log}
              workspaceData={workspaceData}
              isLoggedIn={isLoggedIn}
            />
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
