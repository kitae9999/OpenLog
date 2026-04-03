import Image from "next/image";
import Link from "next/link";
import { assets } from "@/shared/config/assets";
import { GitPullRequestIcon } from "@/shared/ui/icons";
import { Footer, Header } from "@/widgets/chrome/ui";
import { getUserOrRedirectToOnboarding } from "@/features/auth/api/requireOnboarding";

const profile = {
  name: "Sarah Drasner",
  role: "Engineering Manager at Netlify. Vue Core Team member.",
  location: "San Francisco, CA",
  website: "github.com/sarah",
  joinedLabel: "Joined March 2024",
  avatarSrc: assets.defaultAvatar,
} as const;

const authoredPosts = [
  {
    href: "/posts/understanding-react-server-components",
    title: "Understanding React Server Components",
    publishedAtLabel: "2026. 2. 28.",
    readTimeLabel: "8 min read",
    thumbnailSrc: assets.featuredCover,
  },
] as const;

const recentActivity = [
  {
    id: "merged-rsc",
    kind: "Merged PR",
    title: "Understanding React Server Components",
    href: "/posts/understanding-react-server-components/suggests",
    relativeTime: "2 days ago",
  },
  {
    id: "opened-tailwind",
    kind: "Opened PR",
    title: "The Future of CSS: Tailwind v4",
    href: "/posts/tailwind-v4/suggests",
    relativeTime: "5 days ago",
  },
  {
    id: "commented-system-design",
    kind: "Commented",
    title: "The Future of CSS: Tailwind v4",
    href: "/posts/tailwind-v4",
    relativeTime: "1 week ago",
  },
] as const;

export async function ProfileView() {
  const data = await getUserOrRedirectToOnboarding();

  const isLoggedIn = !!data;

  return (
    <div className="flex min-h-dvh flex-col bg-[#f9fafb] text-zinc-950">
      <Header isLoggedIn={isLoggedIn} profileImageUrl={data?.profileImageUrl} />

      <main className="mx-auto w-full max-w-[1083px] flex-1 px-4 pb-20 pt-8 sm:px-8">
        <section className="rounded-[28px] border border-zinc-200/80 bg-white px-6 py-7 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-8 sm:py-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="mx-auto lg:mx-0">
              <div className="rounded-full border-4 border-zinc-50 bg-white p-1">
                <Image
                  src={data?.profileImageUrl ?? assets.defaultAvatar}
                  alt={`${profile.name} avatar`}
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
                    {data?.nickname ?? "openlogger"}
                  </h1>
                  <p className="mt-4 max-w-3xl text-[18px] leading-8 text-zinc-600">
                    {data?.bio ?? "Hello, World!"}
                  </p>
                </div>

                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 self-start rounded-full border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
                >
                  <IconPencil className="size-4" />
                  Edit Profile
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500">
                <ProfileMeta iconSrc="/MapPin.svg" label={profile.location} />
                <ProfileMeta iconSrc="/LinkIcon.svg" label={profile.website} />
                <ProfileMeta
                  iconSrc="/Calendar.svg"
                  label={profile.joinedLabel}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="min-w-0">
            <SectionHeading iconSrc="/FileText.svg" title="Authored Posts" />

            <div className="mt-6">
              {authoredPosts.map((post) => (
                <Link
                  key={post.href}
                  href={post.href}
                  className="group grid grid-cols-[minmax(0,1fr)_64px] items-start gap-4 rounded-xl border-b border-zinc-200/80 px-2 py-4 transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Image
                        src={profile.avatarSrc}
                        alt=""
                        width={20}
                        height={20}
                        aria-hidden="true"
                        className="size-5 rounded-full object-cover"
                      />
                      <span className="font-medium text-zinc-900">
                        {profile.name}
                      </span>
                    </div>

                    <h2 className="mt-2 [font-family:Georgia,serif] text-[17px] font-bold leading-6 tracking-[-0.02em] text-zinc-950">
                      {post.title}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                      <span>{post.publishedAtLabel}</span>
                      <span>{post.readTimeLabel}</span>
                    </div>
                  </div>

                  <div className="relative size-16 overflow-hidden rounded-[4px] bg-zinc-200">
                    <Image
                      src={post.thumbnailSrc}
                      alt={`${post.title} thumbnail`}
                      fill
                      sizes="64px"
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2">
              <span className="text-zinc-900">
                <GitPullRequestIcon className="size-5" />
              </span>
              <h2 className="text-[20px] font-bold tracking-tight text-zinc-950">
                Recent Activity
              </h2>
            </div>

            <ol className="relative mt-6 border-l border-zinc-200 pl-6">
              {recentActivity.map((activity, index) => (
                <li
                  key={activity.id}
                  className={
                    index === recentActivity.length - 1
                      ? "relative"
                      : "relative pb-8"
                  }
                >
                  <span className="absolute -left-[31px] top-2 size-3 rounded-full border-2 border-[#f9fafb] bg-zinc-300" />
                  <p className="text-[14px] leading-6 text-zinc-600">
                    <span className="font-bold text-zinc-950">
                      {activity.kind}
                    </span>{" "}
                    on{" "}
                    <Link
                      href={activity.href}
                      className="font-medium text-[#155dfc] transition hover:text-[#0f46c2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155dfc]/20"
                    >
                      {activity.title}
                    </Link>
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">
                    {activity.relativeTime}
                  </p>
                </li>
              ))}
            </ol>
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

function ProfileMeta({ iconSrc, label }: { iconSrc: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <Image src={iconSrc} alt="" width={16} height={16} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
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
