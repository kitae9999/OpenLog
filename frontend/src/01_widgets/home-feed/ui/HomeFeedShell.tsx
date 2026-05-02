"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Header } from "@/widgets/chrome/ui";
import { cn } from "@/shared/lib/cn";
import {
  feedPosts,
  followingPosts,
  likedPosts,
  tabs,
  type FeedPost,
  type TabKey,
} from "./data";

export function HomeFeedShell({
  activeTab,
  isLoggedIn,
  profileImageUrl,
  profileHref,
  footer,
}: {
  activeTab: TabKey;
  isLoggedIn: boolean;
  profileImageUrl?: string | null;
  profileHref?: string;
  footer: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const posts = getPostsForTab(activeTab);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");

    function syncSidebar(event: MediaQueryList | MediaQueryListEvent) {
      setIsSidebarOpen(event.matches);
    }

    syncSidebar(query);
    query.addEventListener("change", syncSidebar);

    return () => {
      query.removeEventListener("change", syncSidebar);
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-white text-zinc-950">
      <Header
        isLoggedIn={isLoggedIn}
        profileImageUrl={profileImageUrl}
        profileHref={profileHref}
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((current) => !current)}
      />

      <div className="relative flex flex-1 overflow-hidden border-b border-zinc-200/70">
        <button
          type="button"
          aria-label="Close navigation overlay"
          className={cn(
            "fixed bottom-0 left-[282px] right-0 top-16 z-30 bg-zinc-950/20 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
            isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setIsSidebarOpen(false)}
        />

        <HomeSidebar
          activeTab={activeTab}
          isOpen={isSidebarOpen}
          onNavigate={() => {
            if (!window.matchMedia("(min-width: 1024px)").matches) {
              setIsSidebarOpen(false);
            }
          }}
        />

        <main
          className={cn(
            "min-w-0 flex-1 transition-[margin] duration-300 ease-out",
            isSidebarOpen ? "lg:ml-[282px]" : "lg:ml-0",
          )}
        >
          <section
            aria-label="New posts"
            className="mx-auto w-full max-w-[1012px] px-5 pb-16 pt-6 sm:px-8 lg:px-12"
          >
            {activeTab === "home" ? (
              <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-4 text-[15px] font-semibold text-zinc-950">
                <IconClock className="size-5 text-zinc-600" />
                <h1>Recent</h1>
              </div>
            ) : null}

            <div className="divide-y divide-zinc-200/80">
              {posts.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        </main>
      </div>

      {footer}
    </div>
  );
}

function HomeSidebar({
  activeTab,
  isOpen,
  onNavigate,
}: {
  activeTab: TabKey;
  isOpen: boolean;
  onNavigate: () => void;
}) {
  return (
    <aside
      aria-label="Feed navigation"
      className={cn(
        "fixed bottom-0 left-0 top-16 z-40 w-[282px] border-r border-zinc-200/80 bg-white transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <nav className="flex h-full flex-col px-5 py-8">
        <div className="space-y-1">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <Link
                key={tab.key}
                href={getTabHref(tab.key)}
                aria-current={isActive ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "flex h-12 items-center gap-4 rounded-lg px-3 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                  isActive
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950",
                )}
              >
                {tab.key === "home" ? (
                  <IconHome className="size-5" />
                ) : tab.key === "following" ? (
                  <IconUsers className="size-5" />
                ) : (
                  <IconHeart className="size-5" />
                )}
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto border-t border-zinc-200 pt-6 text-[13px] leading-6 text-zinc-500">
          New writing from the OpenLog community, arranged for steady reading.
        </div>
      </nav>
    </aside>
  );
}

function ArticleCard({ post }: { post: FeedPost }) {
  return (
    <article className="py-8">
      <Link
        href={post.href}
        className="group grid gap-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 sm:grid-cols-[minmax(0,1fr)_184px] sm:items-center"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-zinc-600">
            <span className="grid size-6 place-items-center rounded-full bg-zinc-950 text-[11px] font-semibold text-white">
              {post.author.charAt(0)}
            </span>
            {post.publication ? (
              <>
                <span>In {post.publication}</span>
                <span className="text-zinc-300">by</span>
              </>
            ) : null}
            <span className="font-medium text-zinc-800">{post.author}</span>
          </div>

          <h2 className="mt-4 max-w-[680px] text-[24px] font-bold leading-[1.16] tracking-tight text-zinc-950 transition-colors group-hover:text-zinc-700 sm:text-[30px]">
            {post.title}
          </h2>

          <p className="mt-3 max-w-[650px] text-[16px] leading-7 text-zinc-600">
            {post.description}
          </p>
        </div>

        <div className="relative h-[126px] w-full overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 sm:h-[118px]">
          <Image
            src={post.thumbnailSrc}
            alt=""
            fill
            sizes="(min-width: 640px) 184px, 100vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </Link>

      <div className="mt-5 flex items-center justify-between gap-4 text-[13px] text-zinc-500">
        <div className="flex flex-wrap items-center gap-3">
          <IconSparkle className="size-4 text-amber-500" />
          <span>{post.dateLabel}</span>
          <span className="inline-flex items-center gap-1.5">
            <IconClap className="size-4" />
            {post.readCount}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconComment className="size-4" />
            {post.commentCount}
          </span>
        </div>

        <div className="flex items-center gap-2 text-zinc-500">
          <button
            type="button"
            aria-label={`Save ${post.title}`}
            className="grid size-8 place-items-center rounded-full transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            <IconBookmark className="size-5" />
          </button>
          <button
            type="button"
            aria-label={`More actions for ${post.title}`}
            className="grid size-8 place-items-center rounded-full transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            <IconDots className="size-5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function getPostsForTab(tab: TabKey) {
  if (tab === "following") {
    return followingPosts;
  }

  if (tab === "liked") {
    return likedPosts;
  }

  return feedPosts;
}

function getTabHref(tab: TabKey) {
  return tab === "home" ? "/" : `/?tab=${tab}`;
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
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
        d="M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20a6 6 0 0 1 12 0M17 10.5a3 3 0 1 0-1.2-5.75M16.5 14.5A5 5 0 0 1 21.5 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20.3 5.7a5.1 5.1 0 0 0-7.2 0L12 6.8l-1.1-1.1a5.1 5.1 0 1 0-7.2 7.2L12 21l8.3-8.1a5.1 5.1 0 0 0 0-7.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7.5V12l3 2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconClap({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7.5 11.5 5.8 8.1a1.4 1.4 0 0 1 2.5-1.25l1.85 3.7M10.2 10.6 7.9 5.8a1.45 1.45 0 0 1 2.6-1.25l2.55 5.35M13 10.2l-1.8-3.8a1.45 1.45 0 0 1 2.62-1.25L17.6 13M17.6 13l.95-2.65a1.35 1.35 0 0 1 2.6.68c-.9 5.5-3.3 8.15-7.25 8.15H12c-2.9 0-5.35-1.65-6.55-4.3l-1.2-2.65a1.45 1.45 0 0 1 2.6-1.28l1.15 2.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconComment({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6.5 18.5 3 21V5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5V16a2.5 2.5 0 0 1-2.5 2.5h-12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSparkle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.75 14.42 9.58 21.25 12l-6.83 2.42L12 21.25l-2.42-6.83L2.75 12l6.83-2.42L12 2.75Z" />
    </svg>
  );
}

function IconBookmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6.5 4.5A1.5 1.5 0 0 1 8 3h8a1.5 1.5 0 0 1 1.5 1.5V21L12 17.5 6.5 21V4.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconDots({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6.5 12h.01M12 12h.01M17.5 12h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
