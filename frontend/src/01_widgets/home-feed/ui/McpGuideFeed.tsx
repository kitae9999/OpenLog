import { Footer } from "@/widgets/chrome/ui";
import { getUser } from "@/features/auth/api/getUser";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { McpGuideShell } from "./McpGuideShell";
import { listManagedWorkspaces } from "./workspaceApi";

export async function McpGuideFeed() {
  const user = await getUser();
  const workspaces = user ? await listManagedWorkspaces() : [];

  return (
    <McpGuideShell
      isLoggedIn={!!user}
      workspaces={workspaces}
      profileImageUrl={user?.profileImageUrl}
      profileHref={
        user?.username ? buildViewerProfileHref(user.username) : undefined
      }
      footer={<Footer />}
    />
  );
}
