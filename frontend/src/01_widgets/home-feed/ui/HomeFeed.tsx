import { Footer } from "@/widgets/chrome/ui";
import type { TabKey } from "./data";
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

  const isLoggedIn = !!data; // data 있으면 true, 없으면 false

  return (
    <HomeFeedShell
      activeTab={activeTab}
      isLoggedIn={isLoggedIn}
      profileImageUrl={data?.profileImageUrl}
      profileHref={data ? buildViewerProfileHref(data.username) : undefined}
      footer={<Footer />}
    />
  );
}
