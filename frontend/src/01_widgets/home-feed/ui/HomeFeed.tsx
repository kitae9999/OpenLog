import { Footer } from "@/widgets/chrome/ui";
import { getDefaultTab, type TabKey } from "./data";
import { getFollowingPosts } from "@/entities/post/api/getFollowingPosts";
import { getLikedPosts } from "@/entities/post/api/getLikedPosts";
import { getRecentPosts } from "@/entities/post/api/getRecentPosts";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { HomeFeedShell } from "./HomeFeedShell";

export async function HomeFeed({
  activeTab,
  viewer,
}: {
  activeTab?: TabKey;
  viewer?: User | null;
}) {
  const data =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const isLoggedIn = !!data;
  const resolvedTab = activeTab ?? getDefaultTab(isLoggedIn);
  const recentPosts =
    resolvedTab === "home" ? await getRecentPosts(null, 10) : undefined;
  const followingPosts =
    resolvedTab === "following" && data
      ? await getFollowingPosts(null, 10)
      : undefined;
  const likedPosts =
    resolvedTab === "liked" && data ? await getLikedPosts(null, 10) : undefined;

  return (
    <HomeFeedShell
      activeTab={resolvedTab}
      isLoggedIn={isLoggedIn}
      initialHomePosts={recentPosts?.posts ?? []}
      initialHomeNextCursor={recentPosts?.nextCursor ?? null}
      initialHomeHasNext={recentPosts?.hasNext ?? false}
      initialFollowingPosts={followingPosts?.posts ?? []}
      initialFollowingNextCursor={followingPosts?.nextCursor ?? null}
      initialFollowingHasNext={followingPosts?.hasNext ?? false}
      initialLikedPosts={likedPosts?.posts ?? []}
      initialLikedNextCursor={likedPosts?.nextCursor ?? null}
      initialLikedHasNext={likedPosts?.hasNext ?? false}
      profileImageUrl={data?.profileImageUrl}
      profileHref={data ? buildViewerProfileHref(data.username) : undefined}
      footer={<Footer />}
    />
  );
}
