"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Header } from "@/widgets/chrome/ui";
import { cn } from "@/shared/lib/cn";
import { HomeSidebar } from "./HomeFeedShell";
import type { TabKey } from "./data";
import type { ManagedWorkspace, WorkspaceUiData } from "./workspaceTypes";

export function AppChromeShell({
  isLoggedIn,
  profileImageUrl,
  profileHref,
  footer,
  children,
  activeTab = "home",
  workspaceNav,
  settingsNav,
  workspaces = [],
  workspaceData,
  showWriteAction = true,
}: {
  isLoggedIn: boolean;
  profileImageUrl?: string | null;
  profileHref?: string;
  footer: ReactNode;
  children: ReactNode;
  activeTab?: TabKey;
  workspaceNav?:
    | "dashboard"
    | "tasks"
    | "logs"
    | "planner"
    | "graph"
    | "outputs"
    | "memory"
    | "activity";
  settingsNav?: "mcp-guide" | "manage";
  workspaces?: ManagedWorkspace[];
  workspaceData?: WorkspaceUiData | null;
  showWriteAction?: boolean;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  useEffect(() => {
    if (!isSidebarOpen || window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehaviorY = document.body.style.overscrollBehaviorY;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehaviorY = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehaviorY = previousOverscrollBehaviorY;
    };
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-dvh flex-col bg-app text-zinc-950">
      <Header
        isLoggedIn={isLoggedIn}
        profileImageUrl={profileImageUrl}
        profileHref={profileHref}
        showWriteAction={showWriteAction}
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
          activeTab={activeTab}
          workspaceNav={workspaceNav}
          settingsNav={settingsNav}
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
          {children}
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
