import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/features/auth/api/getUser";
import { getPublicUserPosts } from "@/entities/user/api/getPublicUserPosts";
import { getPublicUserProfile } from "@/entities/user/api/getPublicUserProfile";
import { assets } from "@/shared/config/assets";
import {
  buildPublicPostPath,
  buildViewerProfileHref,
} from "@/shared/lib/publicRoutes";
import { Footer, Header } from "@/widgets/chrome/ui";
import { EditableProfileHeader } from "./EditableProfileHeader";

export async function ProfileView({ username }: { username: string }) {
  const [viewer, profile, posts] = await Promise.all([
    getUser(),
    getPublicUserProfile(username),
    getPublicUserPosts(username),
  ]);

  if (!profile || !posts) {
    notFound();
  }

  const isViewer = viewer?.username === profile.username;
  const joinedLabel = formatJoinedLabel(profile.joinedAt);
  const profileName = profile.nickname ?? profile.username;
  const viewerProfileHref = viewer
    ? buildViewerProfileHref(viewer.username)
    : undefined;

  return (
    <div className="flex min-h-dvh flex-col bg-[#f9fafb] text-zinc-950">
      <Header
        isLoggedIn={!!viewer}
        profileImageUrl={viewer?.profileImageUrl}
        profileHref={viewerProfileHref}
      />

      <main className="mx-auto w-full max-w-[1083px] flex-1 px-4 pb-20 pt-8 sm:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="min-w-0 lg:col-start-1">
            <EditableProfileHeader
              profile={profile}
              isViewer={isViewer}
              canFollow={!!viewer && !isViewer}
              joinedLabel={joinedLabel}
            />
          </div>

          <aside
            className="min-w-0 lg:col-start-2 lg:row-span-2"
            aria-label="Recent activity"
          >
            <SectionHeading
              iconSrc="/GitPullRequest.svg"
              title="Recent Activity"
            />
            <EmptyStateCard
              className="mt-6"
              title="Recent activity is not available yet"
              description="Merged PRs, comments, and contribution history will appear here once the activity API is implemented."
            />
          </aside>

          <section className="min-w-0 lg:col-start-1">
            <SectionHeading iconSrc="/FileText.svg" title="Authored Posts" />

            {posts.length > 0 ? (
              <div className="mt-6">
                {posts.map((post, index) => (
                  <Link
                    key={post.slug}
                    href={buildPublicPostPath(profile.username, post.slug)}
                    className="group grid grid-cols-[minmax(0,1fr)_64px] items-start gap-4 rounded-xl border-b border-zinc-200/80 px-2 py-4 transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Image
                          src={profile.profileImageUrl ?? assets.defaultAvatar}
                          alt=""
                          width={20}
                          height={20}
                          aria-hidden="true"
                          className="size-5 rounded-full object-cover"
                        />
                        <span className="font-medium text-zinc-900">
                          {profileName}
                        </span>
                      </div>

                      <h2 className="mt-2 [font-family:Georgia,serif] text-[17px] font-bold leading-6 tracking-[-0.02em] text-zinc-950">
                        {post.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        {post.description}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                        <span>{post.publishedAtLabel}</span>
                      </div>
                    </div>

                    <div className="relative size-16 overflow-hidden rounded-[4px] bg-zinc-200">
                      <Image
                        src={
                          index % 2 === 0
                            ? assets.featuredCover
                            : assets.postCover
                        }
                        alt={`${post.title} thumbnail`}
                        fill
                        sizes="64px"
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyStateCard
                className="mt-6"
                title="No posts yet"
                description="This profile has not published any posts."
              />
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function SectionHeading({
  iconSrc,
  title,
}: {
  iconSrc: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Image src={iconSrc} alt="" width={20} height={20} aria-hidden="true" />
      <h2 className="text-[20px] font-bold tracking-tight text-zinc-950">
        {title}
      </h2>
    </div>
  );
}

function EmptyStateCard({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-6 text-sm text-zinc-500 ${className ?? ""}`}
    >
      <p className="font-semibold text-zinc-800">{title}</p>
      <p className="mt-2 leading-6">{description}</p>
    </div>
  );
}

function formatJoinedLabel(joinedAt: string) {
  const parsed = new Date(joinedAt);
  if (Number.isNaN(parsed.getTime())) {
    return "Joined recently";
  }

  return `Joined ${new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(parsed)}`;
}
