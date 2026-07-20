import { Footer } from "@/widgets/chrome/ui";
import { getDefaultTab, type TabKey } from "@/entities/workspace/model/data";
import { getAuthoredPosts } from "@/entities/post/api/getAuthoredPosts";
import { getFollowingPosts } from "@/entities/post/api/getFollowingPosts";
import { getLikedPosts } from "@/entities/post/api/getLikedPosts";
import { getRecentPosts } from "@/entities/post/api/getRecentPosts";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { HomeFeedShell } from "@/widgets/app-shell/ui/HomeFeedShell";
import {
  loadWorkspacePageData,
  loadWorkspaceShellPageData,
} from "@/entities/workspace/api/workspaceApi";

export async function HomeFeed({
  activeTab,
  activePostStatus = "published",
  viewer,
}: {
  activeTab?: TabKey;
  activePostStatus?: "published" | "drafts";
  viewer?: User | null;
}) {
  const data =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const isLoggedIn = !!data; // data 있으면 true, 없으면 false
  const resolvedTab = activeTab ?? getDefaultTab(isLoggedIn);
  const pageData = isLoggedIn
    ? await (resolvedTab === "workspace"
        ? loadWorkspacePageData()
        : loadWorkspaceShellPageData())
    : { workspaces: [], workspaceData: null };
  const workspaces = pageData.workspaces;
  const workspaceData = pageData.workspaceData;

  const workspaceActivity = workspaceData?.activity ?? null;

  const authoredPosts =
    resolvedTab === "home" && data
      ? await getAuthoredPosts(
          null,
          10,
          activePostStatus === "drafts"
            ? ["DRAFT", "UNPUBLISHED"]
            : ["PUBLISHED"],
        )
      : undefined;
  const recentPosts =
    resolvedTab === "explore" || (resolvedTab === "home" && !data)
      ? await getRecentPosts(null, 10)
      : undefined;
  const followingPosts =
    (resolvedTab === "following" || resolvedTab === "explore") && data
      ? await getFollowingPosts(null, 10)
      : undefined;
  const likedPosts =
    (resolvedTab === "liked" || resolvedTab === "explore") && data
      ? await getLikedPosts(null, 10)
      : undefined;

  return (
    <HomeFeedShell
      activeTab={resolvedTab}
      activePostStatus={activePostStatus}
      isLoggedIn={isLoggedIn}
      initialAuthoredPosts={authoredPosts?.posts ?? []}
      initialAuthoredNextCursor={authoredPosts?.nextCursor ?? null}
      initialAuthoredHasNext={authoredPosts?.hasNext ?? false}
      initialRecentPosts={recentPosts?.posts ?? []}
      initialRecentNextCursor={recentPosts?.nextCursor ?? null}
      initialRecentHasNext={recentPosts?.hasNext ?? false}
      initialFollowingPosts={followingPosts?.posts ?? []}
      initialFollowingNextCursor={followingPosts?.nextCursor ?? null}
      initialFollowingHasNext={followingPosts?.hasNext ?? false}
      initialLikedPosts={likedPosts?.posts ?? []}
      initialLikedNextCursor={likedPosts?.nextCursor ?? null}
      initialLikedHasNext={likedPosts?.hasNext ?? false}
      profileImageUrl={data?.profileImageUrl}
      profileHref={data ? buildViewerProfileHref(data.username) : undefined}
      workspaces={workspaces}
      workspaceData={workspaceData}
      workspaceActivity={workspaceActivity}
      footer={<Footer />}
    />
  );
}
