import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/widgets/profile/ui";
import { parsePublicUsernameParam } from "@/shared/lib/publicRoutes";

export const metadata: Metadata = {
  title: "Profile | OpenLog",
  description: "OpenLog public profile page.",
};

export default async function PublicProfilePage({
  params,
}: {
  params?: Promise<{ username?: string }>;
}) {
  const resolvedParams = await params;
  const username = resolvedParams?.username;

  if (!username) {
    notFound();
  }

  const publicUsername = parsePublicUsernameParam(username);
  if (!publicUsername) {
    notFound();
  }

  return <ProfileView username={publicUsername} />;
}
