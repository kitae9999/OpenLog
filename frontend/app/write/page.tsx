import type { Metadata } from "next";
import { getPublicUserPosts } from "@/entities/user/api/getPublicUserPosts";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";
import { WriteView } from "@/widgets/write/ui";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";

export const metadata: Metadata = {
  title: "Write | OpenLog",
  description: "Compose a new story for the OpenLog knowledge feed.",
};

export default async function WritePage() {
  const data = await getUserOrRedirectToOnboarding();
  const authoredPosts = data?.username
    ? await getPublicUserPosts(data.username)
    : [];

  return (
    <WriteView
      isLoggedIn={!!data}
      profileImageUrl={data?.profileImageUrl}
      profileHref={data ? buildViewerProfileHref(data.username) : undefined}
      authoredPosts={authoredPosts ?? []}
    />
  );
}
