import { redirect } from "next/navigation";
import { Footer } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { ManageShell } from "./ManageShell";
import { listManagedWorkspaces } from "./workspaceApi";

export async function ManageFeed() {
  const user = await getUserOrRedirectToOnboarding();

  if (!user) {
    redirect("/");
  }

  const workspaces = await listManagedWorkspaces();

  return (
    <ManageShell
      isLoggedIn
      profileImageUrl={user.profileImageUrl}
      profileHref={buildViewerProfileHref(user.username)}
      workspaces={workspaces}
      footer={<Footer />}
    />
  );
}
