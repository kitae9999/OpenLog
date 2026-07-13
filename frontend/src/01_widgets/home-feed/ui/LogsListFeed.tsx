import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import type { LogListTypeFilter } from "./data";
import { LogsListShell } from "./LogsListShell";
import { requireWorkspaceData } from "./requireWorkspacePageData";
import { loadWorkspacePageData } from "./workspaceApi";

export async function LogsListFeed({
  typeFilter = "all",
  viewer,
}: {
  typeFilter?: LogListTypeFilter;
  viewer?: User | null;
}) {
  const user =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const pageData = user
    ? await loadWorkspacePageData()
    : { workspaces: [], workspaceData: null, status: "empty" as const };
  const workspaces = pageData.workspaces;
  const workspaceData = user ? requireWorkspaceData(pageData) : null;

  return (
    <LogsListShell
      typeFilter={typeFilter}
      isLoggedIn={!!user}
      profileImageUrl={user?.profileImageUrl}
      profileHref={user ? buildViewerProfileHref(user.username) : undefined}
      workspaces={workspaces}
      workspaceData={workspaceData}
      footer={<Footer />}
    />
  );
}
