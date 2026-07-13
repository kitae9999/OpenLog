import { notFound } from "next/navigation";
import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { OutputDetailShell } from "@/pages/outputs/ui/OutputDetailShell";
import { requireWorkspaceData } from "@/widgets/app-shell/lib/requireWorkspacePageData";
import {
  getWorkspaceOutput,
  loadWorkspaceNavigationPageData,
} from "@/entities/workspace/api/workspaceApi";

export async function OutputDetailFeed({
  viewer,
  outputId,
}: {
  viewer?: User | null;
  outputId: string;
}) {
  const user =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const pageData = user
    ? await loadWorkspaceNavigationPageData()
    : { workspaces: [], workspaceData: null, status: "empty" as const };
  const workspaces = pageData.workspaces;
  const workspaceData = user ? requireWorkspaceData(pageData) : null;
  const output = workspaceData
    ? ((await getWorkspaceOutput(workspaceData.workspaceId, outputId)) ??
      undefined)
    : undefined;

  if (user && !output) {
    notFound();
  }

  return (
    <OutputDetailShell
      isLoggedIn={!!user}
      outputId={outputId}
      output={output}
      workspaces={workspaces}
      workspaceData={workspaceData}
      profileImageUrl={user?.profileImageUrl}
      profileHref={user ? buildViewerProfileHref(user.username) : undefined}
      footer={<Footer />}
    />
  );
}
