import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import type { WorkspaceOutputStatus } from "./data";
import { OutputsListShell } from "./OutputsListShell";

export async function OutputsListFeed({
  viewer,
  status,
}: {
  viewer?: User | null;
  status: WorkspaceOutputStatus;
}) {
  const user =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;

  return (
    <OutputsListShell
      isLoggedIn={!!user}
      status={status}
      profileImageUrl={user?.profileImageUrl}
      profileHref={user ? buildViewerProfileHref(user.username) : undefined}
      footer={<Footer />}
    />
  );
}
