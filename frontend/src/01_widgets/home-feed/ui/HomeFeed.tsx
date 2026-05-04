import { Footer } from "@/widgets/chrome/ui";
import type { TabKey } from "./data";
import { getLikedPosts } from "@/entities/post/api/getLikedPosts";
import { getRecentPosts } from "@/entities/post/api/getRecentPosts";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { HomeFeedShell } from "./HomeFeedShell";

export async function HomeFeed({
  activeTab = "home",
  viewer,
}: {
  activeTab?: TabKey;
  viewer?: User | null;
}) {
  const data =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;
  const recentPosts =
    activeTab === "home" ? await getRecentPosts(null, 10) : undefined;
  const likedPosts =
    activeTab === "liked" && data ? await getLikedPosts(null, 10) : undefined;

  const isLoggedIn = !!data; // data 있으면 true, 없으면 false

  return (
    <HomeFeedShell
      activeTab={activeTab}
      isLoggedIn={isLoggedIn}
      initialHomePosts={recentPosts?.posts ?? []}
      initialHomeNextCursor={recentPosts?.nextCursor ?? null}
      initialHomeHasNext={recentPosts?.hasNext ?? false}
      initialLikedPosts={likedPosts?.posts ?? []}
      initialLikedNextCursor={likedPosts?.nextCursor ?? null}
      initialLikedHasNext={likedPosts?.hasNext ?? false}
      profileImageUrl={data?.profileImageUrl}
      profileHref={data ? buildViewerProfileHref(data.username) : undefined}
      footer={<Footer />}
    />
  );
}
