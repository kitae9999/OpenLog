import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { HomeFeed } from "@/widgets/home-feed/ui";
import { getDefaultTab, type TabKey } from "@/widgets/home-feed/ui/data";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const user = await getUserOrRedirectToOnboarding();
  const isLoggedIn = !!user;
  const tab = normalizeTab(sp?.tab, isLoggedIn);

  return <HomeFeed activeTab={tab} viewer={user} />;
}

function normalizeTab(value: string | undefined, isLoggedIn: boolean): TabKey {
  if (
    value === "workspace" ||
    value === "home" ||
    value === "following" ||
    value === "liked"
  ) {
    return value;
  }

  return getDefaultTab(isLoggedIn);
}
