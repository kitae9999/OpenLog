"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Header } from "@/widgets/chrome/ui";
import type {
  RecentPostCursorPage,
  RecentPostSummary,
} from "@/entities/post/api/getRecentPosts";
import { assets } from "@/shared/config/assets";
import { cn } from "@/shared/lib/cn";
import { buildPublicPostPath } from "@/shared/lib/publicRoutes";
import {
  feedPosts,
  followingPosts,
  tabs,
  type FeedPost,
  type TabKey,
} from "./data";

export function HomeFeedShell({
  activeTab,
  isLoggedIn,
  initialHomePosts,
  initialHomeNextCursor,
  initialHomeHasNext,
  initialLikedPosts,
  initialLikedNextCursor,
  initialLikedHasNext,
  profileImageUrl,
  profileHref,
  footer,
}: {
  activeTab: TabKey;
  isLoggedIn: boolean;
  initialHomePosts: RecentPostSummary[];
  initialHomeNextCursor: string | null;
  initialHomeHasNext: boolean;
  initialLikedPosts: RecentPostSummary[];
  initialLikedNextCursor: string | null;
  initialLikedHasNext: boolean;
  profileImageUrl?: string | null;
  profileHref?: string;
  footer: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [homePosts, setHomePosts] = useState<FeedPost[]>(() =>
    initialHomePosts.map(toFeedPost),
  );
  const [likedFeedPosts, setLikedFeedPosts] = useState<FeedPost[]>(() =>
    initialLikedPosts.map(toFeedPost),
  );
  const [homeNextCursor, setHomeNextCursor] = useState<string | null>(
    initialHomeNextCursor,
  );
  const [likedNextCursor, setLikedNextCursor] = useState<string | null>(
    initialLikedNextCursor,
  );
  const [hasNextHomePage, setHasNextHomePage] = useState(initialHomeHasNext);
  const [hasNextLikedPage, setHasNextLikedPage] =
    useState(initialLikedHasNext);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingMoreRef = useRef(false);
  const posts =
    activeTab === "home"
      ? homePosts
      : activeTab === "liked"
        ? likedFeedPosts
        : getPostsForTab(activeTab);
  const hasNextActivePage =
    activeTab === "home"
      ? hasNextHomePage
      : activeTab === "liked"
        ? hasNextLikedPage
        : false;

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

  useEffect(() => {
    if (!isSidebarOpen || window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehaviorY = document.body.style.overscrollBehaviorY;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehaviorY = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehaviorY = previousOverscrollBehaviorY;
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    setHomePosts(initialHomePosts.map(toFeedPost));
    setHomeNextCursor(initialHomeNextCursor);
    setHasNextHomePage(initialHomeHasNext);
    setLoadError(null);
  }, [initialHomePosts, initialHomeNextCursor, initialHomeHasNext]);

  useEffect(() => {
    setLikedFeedPosts(initialLikedPosts.map(toFeedPost));
    setLikedNextCursor(initialLikedNextCursor);
    setHasNextLikedPage(initialLikedHasNext);
    setLoadError(null);
  }, [initialLikedPosts, initialLikedNextCursor, initialLikedHasNext]);

  const loadMorePosts = useCallback(async () => {
    const endpoint =
      activeTab === "home"
        ? "/api/posts"
        : activeTab === "liked"
          ? "/api/users/me/liked-posts"
          : null;
    const cursor = activeTab === "home" ? homeNextCursor : likedNextCursor;

    if (!endpoint || !hasNextActivePage || !cursor || isLoadingMoreRef.current) {
      return;
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams({
        cursor,
        size: "10",
      });
      const response = await fetch(`${endpoint}?${params}`);

      if (!response.ok) {
        throw new Error("Failed to load posts.");
      }

      const page = (await response.json()) as RecentPostCursorPage;

      if (activeTab === "home") {
        setHomePosts((current) => [
          ...current,
          ...page.posts.map(toFeedPost),
        ]);
        setHomeNextCursor(page.nextCursor);
        setHasNextHomePage(page.hasNext);
      } else {
        setLikedFeedPosts((current) => [
          ...current,
          ...page.posts.map(toFeedPost),
        ]);
        setLikedNextCursor(page.nextCursor);
        setHasNextLikedPage(page.hasNext);
      }
    } catch {
      setLoadError("Could not load more posts.");
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [activeTab, hasNextActivePage, homeNextCursor, likedNextCursor]);

  useEffect(() => {
    if ((activeTab !== "home" && activeTab !== "liked") || !hasNextActivePage) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMorePosts();
        }
      },
      { rootMargin: "360px 0px" },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [activeTab, hasNextActivePage, loadMorePosts]);

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

            {activeTab === "home" || activeTab === "liked" ? (
              <div
                ref={sentinelRef}
                className="flex min-h-24 items-center justify-center py-6 text-sm text-zinc-500"
                aria-live="polite"
              >
                {isLoadingMore
                  ? "Loading posts..."
                  : loadError
                    ? loadError
                    : posts.length === 0
                      ? activeTab === "liked" && !isLoggedIn
                        ? "Log in to see liked posts."
                        : "No posts yet."
                      : hasNextActivePage
                        ? ""
                        : "No more posts."}
              </div>
            ) : null}
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
        "fixed bottom-0 left-0 top-16 z-40 w-[282px] border-r border-t border-zinc-200/80 bg-white transition-transform duration-300 ease-out",
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
          <div className="flex items-center gap-2 text-[13px] text-zinc-600">
            <Image
              src={post.profileImageSrc}
              alt=""
              width={24}
              height={24}
              className="size-6 rounded-full border border-zinc-200 object-cover"
            />
            <span className="font-medium text-zinc-800">{post.nickname}</span>
          </div>

          <h2 className="mt-4 max-w-[680px] text-[24px] font-bold leading-[1.16] tracking-tight text-zinc-950 transition-colors group-hover:text-zinc-700 sm:text-[30px] [font-family:Georgia,serif]">
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

      <div className="mt-5 flex flex-wrap items-center gap-3 text-[13px] text-zinc-500">
        <span>{post.dateLabel}</span>
        <span className="inline-flex items-center gap-1.5">
          <IconComment className="size-4" />
          {post.commentCount}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <IconHeart className="size-4" />
          {post.likeCount}
        </span>
      </div>
    </article>
  );
}

function getPostsForTab(tab: TabKey) {
  if (tab === "following") {
    return followingPosts;
  }

  return feedPosts;
}

const FEED_THUMBNAILS = [
  "/feed/operational-notes.svg",
  "/feed/review-cadence.svg",
  "/feed/knowledge-graph.svg",
  "/feed/quiet-interfaces.svg",
] as const;

function toFeedPost(post: RecentPostSummary): FeedPost {
  return {
    id: String(post.id),
    nickname: post.authorName,
    profileImageSrc: post.authorAvatarSrc || assets.defaultAvatar,
    title: post.title,
    description: post.description,
    dateLabel: post.publishedAtLabel,
    commentCount: formatCompactCount(post.comments),
    likeCount: formatCompactCount(post.likes),
    thumbnailSrc: FEED_THUMBNAILS[post.id % FEED_THUMBNAILS.length],
    href: buildPublicPostPath(post.authorUsername, post.slug),
  };
}

function formatCompactCount(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
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
