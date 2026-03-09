import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  OpenLogFooter,
  OpenLogHeader,
  cn,
  openLogAssets,
} from "./OpenLogChrome";

type TabKey = "trending" | "latest" | "following";

const tabs: Array<{
  key: TabKey;
  label: string;
  Icon: (props: { className?: string }) => ReactNode;
}> = [
  { key: "trending", label: "Trending", Icon: IconTrendingUp },
  { key: "latest", label: "Latest", Icon: IconBookOpen },
  { key: "following", label: "Following", Icon: IconUsers },
];

const recommendedTopics = [
  "React",
  "System Design",
  "Rust",
  "AI/ML",
  "DevOps",
  "GraphQL",
  "Accessibility",
] as const;

const topContributors = [
  {
    name: "Dan Abramov",
    summary: "Merged 42 PRs this week",
    avatar: openLogAssets.avatarA,
  },
  {
    name: "Dan Abramov",
    summary: "Merged 42 PRs this week",
    avatar: openLogAssets.avatarB,
  },
  {
    name: "Dan Abramov",
    summary: "Merged 42 PRs this week",
    avatar: openLogAssets.avatarA,
  },
] as const;

export function OpenLogMain({
  activeTab = "trending",
}: {
  activeTab?: TabKey;
}) {
  return (
    <div className="min-h-dvh bg-white text-zinc-950">
      {/*추후 로그인 기능 넣으면 props로 로그인 여부 전달*/}
      <OpenLogHeader />
      <main className="mx-auto w-full max-w-[1083px] px-4 pb-16 pt-6 sm:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-label="Feed" className="min-w-0">
            <FeedTabs active={activeTab} />

            <div className="mt-6 space-y-10">
              <FeaturedPostCard />
              <PostRow />
            </div>
          </section>

          <aside aria-label="Sidebar" className="space-y-10">
            <KnowledgeGraphCard />
            <RecommendedTopics />
            <TopContributors />
            <ContributeCard />
          </aside>
        </div>
      </main>
      <OpenLogFooter />
    </div>
  );
}

function FeedTabs({ active }: { active: TabKey }) {
  return (
    <div className="border-b border-zinc-200/70">
      <div className="flex gap-6">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Link
              key={tab.key}
              href={`/?tab=${tab.key}`}
              className={cn(
                "relative -mb-px inline-flex items-center gap-2 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                isActive
                  ? "text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-950",
              )}
            >
              <tab.Icon
                className={cn(
                  "size-4",
                  isActive ? "text-zinc-950" : "text-zinc-400",
                )}
              />
              {tab.label}
              {isActive ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-950" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function FeaturedPostCard() {
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm">
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={openLogAssets.featuredCover}
          alt="Featured cover"
          fill
          priority
          sizes="(min-width: 1024px) 663px, 100vw"
          className="object-cover"
        />
        <div className="absolute bottom-4 left-4 rounded-full bg-zinc-950/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
          Featured
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <Image
            src={openLogAssets.avatarB}
            alt="Sarah Drasner avatar"
            width={28}
            height={28}
            className="size-7 rounded-full border border-zinc-200 object-cover"
          />
          <span className="font-medium text-zinc-950">Sarah Drasner</span>
          <span className="text-zinc-300">·</span>
          <span>2026. 2. 28.</span>
          <span className="text-zinc-300">·</span>
          <span>8 min read</span>
        </div>

        <h2 className="mt-4 text-[22px] font-semibold leading-snug tracking-tight text-zinc-950 sm:text-[26px]">
          Understanding React Server Components
        </h2>
        <p className="mt-2 max-w-prose text-[15px] leading-7 text-zinc-600">
          A deep dive into the architecture of RSC and how it changes the way we
          build React applications.
        </p>

        <div className="mt-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-sm text-zinc-500">
            <span className="inline-flex items-center gap-2">
              <IconThumbsUp className="size-4 text-zinc-400" />
              1240
            </span>
            <span className="inline-flex items-center gap-2">
              <IconEye className="size-4 text-zinc-400" />
              8500
            </span>
          </div>

          <div className="flex items-center -space-x-2">
            <Image
              src={openLogAssets.avatarA}
              alt="Reader avatar"
              width={24}
              height={24}
              className="size-6 rounded-full border-2 border-white object-cover"
            />
            <Image
              src={openLogAssets.avatarB}
              alt="Reader avatar"
              width={24}
              height={24}
              className="size-6 rounded-full border-2 border-white object-cover"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function PostRow() {
  return (
    <article className="border-b border-zinc-200/70 pb-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <Image
              src={openLogAssets.avatarA}
              alt="Kent C. Dodds avatar"
              width={28}
              height={28}
              className="size-7 rounded-full border border-zinc-200 object-cover"
            />
            <span className="font-medium text-zinc-950">Kent C. Dodds</span>
            <span className="text-zinc-300">·</span>
            <span>2026. 2. 25.</span>
          </div>

          <h3 className="mt-3 text-[20px] font-semibold leading-snug tracking-tight text-zinc-950 sm:text-[22px]">
            The Future of CSS: Tailwind v4
          </h3>
          <p className="mt-2 text-[15px] leading-7 text-zinc-600">
            Exploring the new engine and features coming in Tailwind CSS v4.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
              CSS
            </span>
            <span className="ml-2 text-xs text-zinc-400">5 min read</span>
          </div>

          <div className="mt-5 flex items-center justify-between gap-6">
            <div className="flex items-center gap-5 text-sm text-zinc-500">
              <span className="inline-flex items-center gap-2">
                <IconThumbsUp className="size-4 text-zinc-400" />
                890
              </span>
            </div>

            <Link
              href="/posts/tailwind-v4"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              Read more <IconArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="relative h-[132px] w-full shrink-0 overflow-hidden rounded-2xl border border-zinc-200/70 bg-zinc-50 md:w-[260px]">
          <Image
            src={openLogAssets.postCover}
            alt="Post cover"
            fill
            sizes="(min-width: 768px) 260px, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </article>
  );
}

function KnowledgeGraphCard() {
  return (
    <section className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-zinc-950">
        <span className="size-1.5 rounded-full bg-blue-500" />
        Knowledge Graph
      </h2>

      <div className="mt-4">
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          Knowledge Graph Visualization
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <Image
          src={openLogAssets.knowledgeGraph}
          alt="Knowledge graph preview"
          width={280}
          height={190}
          className="mx-auto h-auto w-full max-w-[280px]"
        />
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-500">
        Visualize how topics are interconnected across the platform. Click nodes
        to explore.
      </p>
    </section>
  );
}

function RecommendedTopics() {
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wider text-zinc-400">
        RECOMMENDED TOPICS
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {recommendedTopics.map((topic) => (
          <Link
            key={topic}
            href={`/topics/${encodeURIComponent(topic.toLowerCase())}`}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            {topic}
          </Link>
        ))}
      </div>
    </section>
  );
}

function TopContributors() {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wider text-zinc-400">
          TOP CONTRIBUTORS
        </h2>
        <span className="text-zinc-400">
          <IconGitPullRequest className="size-4" />
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {topContributors.map((person, idx) => (
          <div
            key={`${person.name}-${idx}`}
            className="flex items-center gap-3"
          >
            <Image
              src={person.avatar}
              alt={`${person.name} avatar`}
              width={36}
              height={36}
              className="size-9 rounded-full border border-zinc-200 object-cover"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-950">
                {person.name}
              </p>
              <p className="truncate text-xs text-zinc-500">{person.summary}</p>
            </div>

            <button
              type="button"
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContributeCard() {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-zinc-950 to-zinc-800 p-6 text-white shadow-sm">
      <h2 className="text-[18px] font-semibold tracking-tight">
        Contribute to OpenLog
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/75">
        Found an error? Improve technical documentation and build your
        portfolio.
      </p>
      <Link
        href="/contribute"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      >
        Start Contributing <IconArrowRight className="size-4" />
      </Link>
    </section>
  );
}

function IconTrendingUp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 17l7-7 4 4 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 7h7v7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBookOpen({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 19.5V6a2 2 0 012-2h5a2 2 0 012 2v13.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 19.5V6a2 2 0 00-2-2h-5a2 2 0 00-2 2v13.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 18h5M13 18h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 11a4 4 0 100-8 4 4 0 000 8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22 21v-2a4 4 0 00-3-3.87"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 3.13a4 4 0 010 7.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconThumbsUp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14 9V5a3 3 0 00-3-3l-1 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3v11z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 11h9a2 2 0 012 2l-1 7a2 2 0 01-2 2H7V11z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGitPullRequest({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M18 3v6a3 3 0 01-3 3h-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 3v18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 7a2 2 0 100-4 2 2 0 000 4z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M6 23a2 2 0 100-4 2 2 0 000 4z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M18 21a2 2 0 100-4 2 2 0 000 4z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
