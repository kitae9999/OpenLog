import type { Metadata } from "next";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { WriteView } from "@/widgets/write/ui";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";

export const metadata: Metadata = {
  title: "Write | OpenLog",
  description: "Compose a new story for the OpenLog knowledge feed.",
};

export default async function WritePage() {
  const data = await getUserOrRedirectToOnboarding();

  return (
    <WriteView
      isLoggedIn={!!data}
      profileImageUrl={data?.profileImageUrl}
      profileHref={data ? buildViewerProfileHref(data.username) : undefined}
    />
  );
}
