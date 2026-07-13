import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { HomeFeed } from "@/widgets/home-feed/ui";
import { LandingPage } from "@/widgets/landing/ui";
import { getDefaultTab, type TabKey } from "@/widgets/home-feed/ui/data";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>; // 객체 구조 분해할당, searchParams는 Next가 자동으로 넘겨줌
}) {
  const sp = await searchParams;
  const user = await getUserOrRedirectToOnboarding();
  const isLoggedIn = !!user;
  const tab = normalizeTab(sp?.tab, isLoggedIn);

  if (!isLoggedIn && !sp?.tab) {
    return <LandingPage />;
  }

  return <HomeFeed activeTab={tab} viewer={user} />;
}

function normalizeTab(value: string | undefined, isLoggedIn: boolean): TabKey {
  if (
    value === "workspace" ||
    value === "explore" ||
    value === "home" ||
    value === "following" ||
    value === "liked"
  ) {
    return value;
  }

  return getDefaultTab(isLoggedIn);
}
