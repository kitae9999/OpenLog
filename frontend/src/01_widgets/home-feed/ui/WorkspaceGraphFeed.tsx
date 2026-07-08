import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { WorkspaceGraphShell } from "./WorkspaceGraphShell";

export async function WorkspaceGraphFeed({ viewer }: { viewer?: User | null }) {
  const user =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;

  return (
    <WorkspaceGraphShell
      isLoggedIn={!!user}
      profileImageUrl={user?.profileImageUrl}
      profileHref={user ? buildViewerProfileHref(user.username) : undefined}
      footer={<Footer />}
    />
  );
}
