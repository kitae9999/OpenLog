"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { Header, Footer } from "@/widgets/chrome/ui";
import { HomeSidebar } from "@/widgets/app-shell/ui/HomeFeedShell";
import { WorkspaceAppContext } from "@/features/app-session/model/WorkspaceAppContext";
import type { AppBootstrap } from "@/features/app-session/model/appBootstrap";
import { clientApi } from "@/shared/api/clientApi";
import { workspaceQueryKeys } from "@/shared/api/queryKeys";
import { cn } from "@/shared/lib/cn";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { useSidebarOpenState } from "@/shared/lib/useSidebarOpenState";
import { setActiveWorkspaceId } from "@/features/workspace-selection/model/workspaceSelection";
import type {
  WorkspaceNavigationSummary,
  WorkspaceUiData,
} from "@/entities/workspace/model/workspaceTypes";

export function WorkspaceAppShell({
  bootstrap,
  children,
}: {
  bootstrap: AppBootstrap;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [activeWorkspaceId, setActiveId] = useState(
    bootstrap.activeWorkspaceId,
  );
  const { isSidebarOpen, setIsSidebarOpen, closeSidebarIfMobile } =
    useSidebarOpenState();
  const navigation = useQuery({
    queryKey: workspaceQueryKeys.navigation(activeWorkspaceId ?? "none"),
    queryFn: () =>
      clientApi<WorkspaceNavigationSummary>(
        `/api/workspaces/${activeWorkspaceId}/navigation-summary`,
      ),
    enabled: activeWorkspaceId !== null,
    staleTime: 30_000,
  });
  const activeWorkspace = bootstrap.workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  );
  const workspaceData = useMemo<WorkspaceUiData | null>(() => {
    if (!activeWorkspace || !activeWorkspaceId) {
      return null;
    }
    return {
      workspaceId: activeWorkspaceId,
      workspaceName: activeWorkspace.name,
      repositoryFullName:
        activeWorkspace.projects.length === 1
          ? activeWorkspace.projects[0].repositoryFullName
          : null,
      projects: activeWorkspace.projects,
      tasks: [],
      logs: [],
      outputs: [],
      todos: [],
      taskLinks: [],
      logLinks: [],
      crossLinks: [],
      memories: [],
      activity: null,
      navigationSummary: navigation.data ?? undefined,
      workingBrief: null,
    };
  }, [activeWorkspace, activeWorkspaceId, navigation.data]);
  const activeNavigation = resolveNavigation(pathname);

  function selectWorkspace(workspaceId: string) {
    setActiveWorkspaceId(workspaceId);
    setActiveId(workspaceId);
  }

  return (
    <WorkspaceAppContext.Provider
      value={{ bootstrap, activeWorkspaceId, selectWorkspace }}
    >
      <div className="flex min-h-dvh flex-col bg-app text-zinc-950">
        <Header
          isLoggedIn
          profileImageUrl={bootstrap.user.profileImageUrl}
          profileHref={
            bootstrap.user.username
              ? buildViewerProfileHref(bootstrap.user.username)
              : "/"
          }
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setIsSidebarOpen((current) => !current)}
        />
        <div className="relative flex flex-1 overflow-hidden border-b border-zinc-200/70">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className={cn(
              "fixed bottom-0 left-[282px] right-0 top-16 z-30 bg-zinc-950/20 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
              isSidebarOpen
                ? "opacity-100"
                : "pointer-events-none opacity-0",
            )}
            onClick={() => setIsSidebarOpen(false)}
          />
          <HomeSidebar
            activeTab="workspace"
            workspaceNav={activeNavigation.workspaceNav}
            logsFilter={activeNavigation.logsFilter}
            settingsNav={activeNavigation.settingsNav}
            isLoggedIn
            isOpen={isSidebarOpen}
            workspaces={bootstrap.workspaces}
            workspaceData={workspaceData}
            onNavigate={closeSidebarIfMobile}
            onWorkspaceSelect={selectWorkspace}
          />
          <main
            className={cn(
              "min-w-0 flex-1 bg-app transition-[margin] duration-300 ease-out",
              isSidebarOpen ? "lg:ml-[282px]" : "lg:ml-0",
            )}
          >
            {children}
          </main>
        </div>
        <div
          className={cn(
            "transition-[margin] duration-300 ease-out",
            isSidebarOpen ? "lg:ml-[282px]" : "lg:ml-0",
          )}
        >
          <Footer />
        </div>
      </div>
    </WorkspaceAppContext.Provider>
  );
}

function resolveNavigation(pathname: string) {
  const logsFilter = pathname === "/logs/issues"
    ? "issues"
    : pathname === "/logs/fixes"
      ? "fixes"
      : pathname === "/logs/decisions"
        ? "decisions"
        : pathname === "/logs/notes"
          ? "notes"
          : "all";
  const workspaceNav = pathname.startsWith("/tasks")
    ? "tasks"
    : pathname.startsWith("/logs")
      ? "logs"
      : pathname.startsWith("/planner")
        ? "planner"
        : pathname.startsWith("/graph")
          ? "graph"
          : pathname.startsWith("/outputs")
            ? "outputs"
            : pathname.startsWith("/memory")
              ? "memory"
              : pathname.startsWith("/activity")
                ? "activity"
                : "dashboard";
  const settingsNav = pathname === "/settings/manage"
    ? "manage"
    : pathname.includes("/agent")
      ? "agent"
      : undefined;
  return { workspaceNav, logsFilter, settingsNav } as const;
}
