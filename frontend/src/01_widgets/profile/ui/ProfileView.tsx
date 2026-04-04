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
        <section className="rounded-[28px] border border-zinc-200/80 bg-white px-6 py-7 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-8 sm:py-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="mx-auto lg:mx-0">
              <div className="rounded-full border-4 border-zinc-50 bg-white p-1">
                <Image
                  src={profile.profileImageUrl ?? assets.defaultAvatar}
                  alt={`${profileName} avatar`}
                  width={128}
                  height={128}
                  className="size-28 rounded-full object-cover sm:size-32"
                  priority
                />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h1 className="font-[Georgia,serif] text-[40px] font-bold leading-none tracking-[-0.04em] text-zinc-950 sm:text-[48px]">
                    {profileName}
                  </h1>
                  <p className="mt-3 text-sm font-medium text-zinc-500">
                    @{profile.username}
                  </p>
                  <p className="mt-4 max-w-3xl text-[18px] leading-8 text-zinc-600">
                    {profile.bio ?? "No bio added yet."}
                  </p>
                </div>

                {isViewer ? (
                  <button
                    type="button"
                    className="inline-flex h-11 items-center gap-2 self-start rounded-full border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
                  >
                    <IconPencil className="size-4" />
                    Edit Profile
                  </button>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500">
                <ProfileMeta iconSrc="/Calendar.svg" label={joinedLabel} />
                <ProfileMeta
                  iconSrc="/MapPin.svg"
                  label="No location added yet."
                  muted
                />
                <ProfileMeta
                  iconSrc="/LinkIcon.svg"
                  label="No website added yet."
                  muted
                />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="min-w-0">
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
                        <span>{post.readTimeLabel}</span>
                      </div>
                    </div>

                    <div className="relative size-16 overflow-hidden rounded-[4px] bg-zinc-200">
                      <Image
                        src={index % 2 === 0 ? assets.featuredCover : assets.postCover}
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

          <section>
            <SectionHeading
              iconSrc="/GitPullRequest.svg"
              title="Recent Activity"
            />
            <EmptyStateCard
              className="mt-6"
              title="Recent activity is not available yet"
              description="Merged PRs, comments, and contribution history will appear here once the activity API is implemented."
            />
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

function ProfileMeta({
  iconSrc,
  label,
  muted = false,
}: {
  iconSrc: string;
  label: string;
  muted?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <Image src={iconSrc} alt="" width={16} height={16} aria-hidden="true" />
      <span className={muted ? "text-zinc-400" : undefined}>{label}</span>
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

function IconPencil({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4 12.5-12.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
