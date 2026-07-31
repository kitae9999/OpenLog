"use client";

import { WorkspaceAppContext } from "@/features/app-session/model/WorkspaceAppContext";
import type { AppBootstrap } from "@/features/app-session/model/appBootstrap";
import {
  WorkspaceLogCreateQueryView,
  WorkspaceLogQueryView,
  WorkspaceLogsQueryView,
  WorkspaceMemoryEditorQueryView,
  WorkspaceMemoryQueryView,
  WorkspaceOutputQueryView,
  WorkspaceTaskQueryView,
  WorkspaceTasksQueryView,
} from "@/pages/workspace-query/ui/WorkspaceQueryViews";

export type WorkspaceQueryFixtureView =
  | "tasks"
  | "memory"
  | "issues"
  | "task-detail"
  | "log-create"
  | "log-detail"
  | "output-detail"
  | "memory-new";

const bootstrap: AppBootstrap = {
  user: {
    id: 1,
    username: "tester",
    nickname: "Tester",
    email: "tester@example.com",
    profileImageUrl: null,
    bio: null,
    isOnboardingComplete: true,
  },
  workspaces: [
    {
      id: "10",
      slug: "query-fixture",
      name: "Query Fixture",
      projects: [],
    },
  ],
  activeWorkspaceId: "10",
  navigationSummary: {
    activeTaskCount: 21,
    logsCount: 2,
    openIssuesCount: 1,
  },
  notificationSummary: { unreadCount: 0 },
};

export function WorkspaceQueryFixture({
  view,
}: {
  view: WorkspaceQueryFixtureView;
}) {
  return (
    <WorkspaceAppContext.Provider
      value={{
        bootstrap,
        activeWorkspaceId: "10",
        selectWorkspace: () => undefined,
      }}
    >
      <main data-testid="workspace-query-fixture">
        {view === "tasks" ? <WorkspaceTasksQueryView /> : null}
        {view === "memory" ? <WorkspaceMemoryQueryView /> : null}
        {view === "issues" ? (
          <WorkspaceLogsQueryView typeFilter="issues" />
        ) : null}
        {view === "task-detail" ? (
          <WorkspaceTaskQueryView taskId="1" mode="detail" />
        ) : null}
        {view === "log-create" ? <WorkspaceLogCreateQueryView /> : null}
        {view === "log-detail" ? (
          <WorkspaceLogQueryView logId="101" mode="detail" />
        ) : null}
        {view === "output-detail" ? (
          <WorkspaceOutputQueryView outputId="201" />
        ) : null}
        {view === "memory-new" ? (
          <WorkspaceMemoryEditorQueryView mode="new" />
        ) : null}
      </main>
    </WorkspaceAppContext.Provider>
  );
}
