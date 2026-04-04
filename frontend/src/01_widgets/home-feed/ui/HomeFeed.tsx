import { Footer, Header } from "@/widgets/chrome/ui";
import { ContributeCard } from "./ContributeCard";
import { FeedTabs } from "./FeedTabs";
import { FeaturedPostCard } from "./FeaturedPostCard";
import { KnowledgeGraphCard } from "./KnowledgeGraphCard";
import { PostRow } from "./PostRow";
import { RecommendedTopics } from "./RecommendedTopics";
import { TopContributors } from "./TopContributors";
import type { TabKey } from "./data";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import type { User } from "@/entities/user/model/User";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";

export async function HomeFeed({
  activeTab = "trending",
  viewer,
}: {
  activeTab?: TabKey;
  viewer?: User | null;
}) {
  const data =
    viewer === undefined ? await getUserOrRedirectToOnboarding() : viewer;

  const isLoggedIn = !!data; // data 있으면 true, 없으면 false

  const resolvedActiveTab =
    !isLoggedIn && activeTab === "following" ? "trending" : activeTab;

  return (
    <div className="min-h-dvh bg-white text-zinc-950">
      <Header
        isLoggedIn={isLoggedIn}
        profileImageUrl={data?.profileImageUrl}
        profileHref={data ? buildViewerProfileHref(data.username) : undefined}
      />
      <main className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-label="Feed" className="min-w-0">
            <FeedTabs active={resolvedActiveTab} isLoggedIn={isLoggedIn} />

            <div className="mt-6 space-y-10">
              <FeaturedPostCard />
              <PostRow />
            </div>
          </section>

          <aside aria-label="Sidebar" className="space-y-10">
            <KnowledgeGraphCard />
            <RecommendedTopics />
            <TopContributors />
            <ContributeCard />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
