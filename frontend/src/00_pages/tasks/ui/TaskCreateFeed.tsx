import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { TaskCreateShell } from "@/pages/tasks/ui/TaskCreateShell";
import { requireWorkspaceData } from "@/widgets/app-shell/lib/requireWorkspacePageData";
import { loadWorkspaceNavigationPageData } from "@/entities/workspace/api/workspaceApi";

export async function TaskCreateFeed({
  viewer,
}: {
  viewer?: User | null;
} = {}) {
  const user =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const pageData = user
    ? await loadWorkspaceNavigationPageData()
    : { workspaces: [], workspaceData: null, status: "empty" as const };
  const workspaces = pageData.workspaces;
  const workspaceData = user ? requireWorkspaceData(pageData) : null;

  return (
    <TaskCreateShell
      isLoggedIn={!!user}
      profileImageUrl={user?.profileImageUrl}
      profileHref={user ? buildViewerProfileHref(user.username) : undefined}
      workspaces={workspaces}
      workspaceData={workspaceData}
      footer={<Footer />}
    />
  );
}
