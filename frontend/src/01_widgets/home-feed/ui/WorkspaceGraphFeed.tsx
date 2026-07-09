import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { WorkspaceGraphShell } from "./WorkspaceGraphShell";
import { loadWorkspacePageData } from "./workspaceApi";

export async function WorkspaceGraphFeed({ viewer }: { viewer?: User | null }) {
  const user =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const pageData = user ? await loadWorkspacePageData() : { workspaces: [], workspaceData: null };
  const workspaces = pageData.workspaces;
  const workspaceData = pageData.workspaceData;

  return (
    <WorkspaceGraphShell
      isLoggedIn={!!user}
      profileImageUrl={user?.profileImageUrl}
      profileHref={user ? buildViewerProfileHref(user.username) : undefined}
      workspaces={workspaces}
      workspaceData={workspaceData}
      footer={<Footer />}
    />
  );
}
