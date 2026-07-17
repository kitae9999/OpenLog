"use client";

import { WorkspaceAgentSettingsView } from "@/pages/workspace-agent/ui/WorkspaceAgentSettingsView";
import { HomeSidebar } from "@/widgets/app-shell/ui/HomeFeedShell";
import type { WorkspaceAgentSettingsData } from "@/entities/workspace/api/workspaceAgentApi";

const fixture: WorkspaceAgentSettingsData = {
  workspace: {
    id: "10",
    slug: "openlog",
    name: "OpenLog",
    projects: [
      {
        id: "20",
        workspaceId: "10",
        displayName: "openlog/openlog",
        repositoryFullName: "openlog/openlog",
        captureMode: "ASK",
        createdAt: "2026-07-14T10:00:00",
        updatedAt: "2026-07-14T10:00:00",
      },
      {
        id: "21",
        workspaceId: "10",
        displayName: "local-api",
        repositoryFullName: null,
        captureMode: "EXPLICIT",
        createdAt: "2026-07-14T10:00:00",
        updatedAt: "2026-07-14T10:00:00",
      },
    ],
  },
  guide: {
    content: "# Workspace Agent Guide\n\n## What is worth recording\n\n- Decisions and rationale\n- Verified fixes",
    revision: 4,
    createdAt: "2026-07-14T10:00:00",
    updatedAt: "2026-07-14T10:00:00",
  },
};

export default function AgentSettingsFixturePage() {
  return (
    <div className="min-h-dvh bg-app">
      <HomeSidebar
        activeTab="workspace"
        isLoggedIn
        isOpen
        onNavigate={() => undefined}
        workspaces={[fixture.workspace]}
      />
      <main className="min-h-dvh px-6 py-8 lg:pl-[306px]">
        <WorkspaceAgentSettingsView data={fixture} locale="ko" />
      </main>
    </div>
  );
}
