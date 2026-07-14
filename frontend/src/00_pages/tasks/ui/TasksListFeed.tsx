import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { TasksListShell } from "@/pages/tasks/ui/TasksListShell";
import { requireWorkspaceData } from "@/widgets/app-shell/lib/requireWorkspacePageData";
import { loadWorkspacePageData } from "@/entities/workspace/api/workspaceApi";

export async function TasksListFeed({ viewer }: { viewer?: User | null }) {
  const user =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const pageData = user
    ? await loadWorkspacePageData()
    : { workspaces: [], workspaceData: null, status: "empty" as const };
  const workspaces = pageData.workspaces;
  const workspaceData = user ? requireWorkspaceData(pageData) : null;

  return (
    <TasksListShell
      isLoggedIn={!!user}
      profileImageUrl={user?.profileImageUrl}
      profileHref={user ? buildViewerProfileHref(user.username) : undefined}
      workspaces={workspaces}
      workspaceData={workspaceData}
      footer={<Footer />}
    />
  );
}
