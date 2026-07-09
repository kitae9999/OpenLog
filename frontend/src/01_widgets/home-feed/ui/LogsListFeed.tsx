import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import type { LogListTypeFilter } from "./data";
import { LogsListShell } from "./LogsListShell";
import { getWorkspaceUiData } from "./workspaceApi";

export async function LogsListFeed({
  typeFilter = "all",
  viewer,
}: {
  typeFilter?: LogListTypeFilter;
  viewer?: User | null;
}) {
  const user =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const workspaceData = user ? await getWorkspaceUiData() : null;

  return (
    <LogsListShell
      typeFilter={typeFilter}
      isLoggedIn={!!user}
      profileImageUrl={user?.profileImageUrl}
      profileHref={user ? buildViewerProfileHref(user.username) : undefined}
      workspaceData={workspaceData}
      footer={<Footer />}
    />
  );
}
