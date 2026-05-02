import Image from "next/image";
import { notFound } from "next/navigation";
import { getUser } from "@/features/auth/api/getUser";
import { getPublicUserPosts } from "@/entities/user/api/getPublicUserPosts";
import { getPublicUserPostGraph } from "@/entities/user/api/getPublicUserPostGraph";
import { getPublicUserProfile } from "@/entities/user/api/getPublicUserProfile";
import { buildViewerProfileHref } from "@/shared/lib/publicRoutes";
import { Footer, Header } from "@/widgets/chrome/ui";
import { AuthoredPostsSection } from "./AuthoredPostsSection";
import { EditableProfileHeader } from "./EditableProfileHeader";

export async function ProfileView({ username }: { username: string }) {
  const [viewer, profile, posts, graph] = await Promise.all([
    getUser(),
    getPublicUserProfile(username),
    getPublicUserPosts(username),
    getPublicUserPostGraph(username),
  ]);

  if (!profile || !posts || !graph) {
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
            <AuthoredPostsSection
              username={profile.username}
              profileName={profileName}
              profileImageUrl={profile.profileImageUrl}
              posts={posts}
              graph={graph}
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
