import { redirect } from "next/navigation";
import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { WorkspaceCreateShell } from "./WorkspaceCreateShell";
import { listManagedWorkspaces } from "./workspaceApi";

export async function WorkspaceCreateFeed() {
  const user = await getUserOrRedirectToOnboarding();

  if (!user) {
    redirect("/");
  }

  const workspaces = await listManagedWorkspaces();

  return (
    <WorkspaceCreateShell
      isLoggedIn
      workspaces={workspaces}
      profileImageUrl={user.profileImageUrl}
      profileHref={buildViewerProfileHref(user.username)}
      footer={<Footer />}
    />
  );
}
