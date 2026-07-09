import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { OutputCreateShell } from "./OutputCreateShell";
import { getWorkspaceUiData } from "./workspaceApi";

export async function OutputCreateFeed({
  viewer,
  taskId,
}: {
  viewer?: User | null;
  taskId?: string;
}) {
  const user =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const workspaceData = user ? await getWorkspaceUiData() : null;

  return (
    <OutputCreateShell
      isLoggedIn={!!user}
      taskId={taskId}
      profileImageUrl={user?.profileImageUrl}
      profileHref={user ? buildViewerProfileHref(user.username) : undefined}
      workspaceData={workspaceData}
      footer={<Footer />}
    />
  );
}
