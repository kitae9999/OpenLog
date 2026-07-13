import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/widgets/profile/ui";
import { getPublicUserProfile } from "@/entities/user/api/getPublicUserProfile";
import { SITE_NAME } from "@/shared/config/site";
import {
  buildPublicProfilePath,
  parsePublicUsernameParam,
} from "@/shared/lib/publicRoutes";

type PublicProfilePageProps = {
  params?: Promise<{ username?: string }>;
};

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const usernameParam = (await params)?.username;
  const username = usernameParam
    ? parsePublicUsernameParam(usernameParam)
    : null;
  if (!username) {
    return noIndexMetadata();
  }

  const profile = await getPublicUserProfile(username);
  if (!profile) {
    return noIndexMetadata();
  }

  const displayName = profile.nickname?.trim() || profile.username;
  const title = `${displayName} (@${profile.username})`;
  const description = toMetaDescription(
    profile.bio,
    `Developer posts and durable knowledge shared by ${displayName} on ${SITE_NAME}.`,
  );
  const canonical = buildPublicProfilePath(profile.username);
  const images = profile.profileImageUrl
    ? [{ url: profile.profileImageUrl, alt: `${displayName} profile image` }]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "profile",
      url: canonical,
      title: `${title} | ${SITE_NAME}`,
      description,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: `${title} | ${SITE_NAME}`,
      description,
      images,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
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

function noIndexMetadata(): Metadata {
  return {
    title: "Profile not found",
    robots: { index: false, follow: false },
  };
}

function toMetaDescription(
  value: string | null,
  fallback: string,
): string {
  const normalized = value?.replace(/\s+/g, " ").trim() || fallback;
  return normalized.length > 160
    ? `${normalized.slice(0, 157).trimEnd()}...`
    : normalized;
}
