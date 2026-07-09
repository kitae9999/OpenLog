import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { TasksListShell } from "./TasksListShell";
import { getWorkspaceUiData } from "./workspaceApi";

export async function TasksListFeed({ viewer }: { viewer?: User | null }) {
  const user =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const workspaceData = user ? await getWorkspaceUiData() : null;

  return (
    <TasksListShell
      isLoggedIn={!!user}
      profileImageUrl={user?.profileImageUrl}
      profileHref={user ? buildViewerProfileHref(user.username) : undefined}
      workspaceData={workspaceData}
      footer={<Footer />}
    />
  );
}
