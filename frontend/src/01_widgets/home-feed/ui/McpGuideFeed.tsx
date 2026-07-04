import { Footer } from "@/widgets/chrome/ui";
import { getUser } from "@/features/auth/api/getUser";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { McpGuideShell } from "./McpGuideShell";

export async function McpGuideFeed() {
  const user = await getUser();

  return (
    <McpGuideShell
      isLoggedIn={!!user}
      profileImageUrl={user?.profileImageUrl}
      profileHref={
        user?.username ? buildViewerProfileHref(user.username) : undefined
      }
      footer={<Footer />}
    />
  );
}
