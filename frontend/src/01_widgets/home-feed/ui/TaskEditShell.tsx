"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Header } from "@/widgets/chrome/ui";
import { cn } from "@/shared/lib/cn";
import type { WorkspaceWorkItem } from "./data";
import { TaskEditView } from "./TaskEditView";
import { HomeSidebar } from "./HomeFeedShell";
import { mergeTaskWithOverrides } from "./taskOverrides";
import type { ManagedWorkspace, WorkspaceUiData } from "./workspaceTypes";

export function TaskEditShell({
  task: initialTask,
  workspaces = [],
  workspaceData,
  isLoggedIn,
  profileImageUrl,
  profileHref,
  footer,
}: {
  taskId: string;
  task: WorkspaceWorkItem;
  workspaces?: ManagedWorkspace[];
  workspaceData?: WorkspaceUiData | null;
  isLoggedIn: boolean;
  profileImageUrl?: string | null;
  profileHref?: string;
  footer: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const task = workspaceData
    ? initialTask
    : mergeTaskWithOverrides(initialTask);

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
    <div className="flex min-h-dvh flex-col bg-zinc-50 text-zinc-950">
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
          onNavigate={() => {
            if (!window.matchMedia("(min-width: 1024px)").matches) {
              setIsSidebarOpen(false);
            }
          }}
        />

        <main
          className={cn(
            "min-w-0 flex-1 bg-zinc-50 transition-[margin] duration-300 ease-out",
            isSidebarOpen ? "lg:ml-[282px]" : "lg:ml-0",
          )}
        >
          <section
            aria-label="Edit task"
            className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 xl:px-10"
          >
            <TaskEditView task={task} workspaceId={workspaceData?.workspaceId} />
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
