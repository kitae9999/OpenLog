import type { Metadata } from "next";
import { getPublicUserPosts } from "@/entities/user/api/getPublicUserPosts";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { WriteView } from "@/widgets/write/ui";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { loadAppChromeWorkspace } from "@/widgets/home-feed/ui/loadAppChromeWorkspace";

export const metadata: Metadata = {
  title: "Write | OpenLog",
  description: "Compose a new story for the OpenLog knowledge feed.",
};

export default async function WritePage() {
  const data = await getUserOrRedirectToOnboarding();
  const [authoredPosts, chrome] = await Promise.all([
    data?.username ? getPublicUserPosts(data.username) : Promise.resolve([]),
    loadAppChromeWorkspace(!!data),
  ]);

  return (
    <WriteView
      isLoggedIn={!!data}
      profileImageUrl={data?.profileImageUrl}
      profileHref={data ? buildViewerProfileHref(data.username) : undefined}
      authoredPosts={authoredPosts ?? []}
      workspaces={chrome.workspaces}
      workspaceData={chrome.workspaceData}
    />
  );
}
