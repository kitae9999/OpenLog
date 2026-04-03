import type { Metadata } from "next";
import { getIncompleteUserOrRedirectHome } from "@/features/auth/api/requireOnboarding";
import { HomeFeed } from "@/widgets/home-feed/ui";
import { OnboardingView } from "@/widgets/onboarding/ui";

export const metadata: Metadata = {
  title: "Onboarding | OpenLog",
  description: "Finish setting up your OpenLog profile.",
};

export default async function OnboardingPage() {
  const user = await getIncompleteUserOrRedirectHome();

  return (
    <>
      <HomeFeed viewer={user} />
      <OnboardingView user={user} />
    </>
  );
}
