"use client";

import { type ReactNode } from "react";
import { Header } from "@/widgets/chrome/ui";
import { cn } from "@/shared/lib/cn";
import { useSidebarOpenState } from "@/shared/lib/useSidebarOpenState";
import { TasksListView } from "@/pages/tasks/ui/TasksListView";
import { HomeSidebar } from "@/widgets/app-shell/ui/HomeFeedShell";
import type { ManagedWorkspace, WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

export function TasksListShell({
  isLoggedIn,
  profileImageUrl,
  profileHref,
  workspaces = [],
  workspaceData,
  footer,
}: {
  isLoggedIn: boolean;
  profileImageUrl?: string | null;
  profileHref?: string;
  workspaces?: ManagedWorkspace[];
  workspaceData?: WorkspaceUiData | null;
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
          workspaceNav="tasks"
          isLoggedIn={isLoggedIn}
          isOpen={isSidebarOpen}
          workspaces={workspaces}
          workspaceData={workspaceData}
          onNavigate={closeSidebarIfMobile}
        />

        <main
          className={cn(
            "min-w-0 flex-1 bg-app transition-[margin] duration-300 ease-out",
            isSidebarOpen ? "lg:ml-[282px]" : "lg:ml-0",
          )}
        >
          <section
            aria-label="Tasks"
            className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 xl:px-10"
          >
            <TasksListView
              isLoggedIn={isLoggedIn}
              workspaceData={workspaceData}
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
