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
  countDoingTasks,
  countLogsByType,
  countOpenIssues,
  feedPosts,
  getLogsHref,
  getMcpGuideHref,
  getTabHref,
  getTasksHref,
  logsSubnavItems,
  recommendedTopics,
  topContributors,
  workspaceLogs,
  type FeedPost,
  type LogListTypeFilter,
  type TabKey,
} from "./data";
import { WorkspaceView } from "./WorkspaceView";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { FeedArticleCard } from "./FeedArticleCard";

export function HomeFeedShell({
  activeTab,
  isLoggedIn,
  initialHomePosts,
  initialHomeNextCursor,
  initialHomeHasNext,
  initialFollowingPosts,
  initialFollowingNextCursor,
  initialFollowingHasNext,
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
  initialFollowingPosts: RecentPostSummary[];
  initialFollowingNextCursor: string | null;
  initialFollowingHasNext: boolean;
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
  const [followingFeedPosts, setFollowingFeedPosts] = useState<FeedPost[]>(() =>
    initialFollowingPosts.map(toFeedPost),
  );
  const [likedFeedPosts, setLikedFeedPosts] = useState<FeedPost[]>(() =>
    initialLikedPosts.map(toFeedPost),
  );
  const [homeNextCursor, setHomeNextCursor] = useState<string | null>(
    initialHomeNextCursor,
  );
  const [followingNextCursor, setFollowingNextCursor] = useState<string | null>(
    initialFollowingNextCursor,
  );
  const [likedNextCursor, setLikedNextCursor] = useState<string | null>(
    initialLikedNextCursor,
  );
  const [hasNextHomePage, setHasNextHomePage] = useState(initialHomeHasNext);
  const [hasNextFollowingPage, setHasNextFollowingPage] = useState(
    initialFollowingHasNext,
  );
  const [hasNextLikedPage, setHasNextLikedPage] = useState(initialLikedHasNext);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingMoreRef = useRef(false);
  const posts =
    activeTab === "home"
      ? homePosts
      : activeTab === "following"
        ? followingFeedPosts
        : activeTab === "liked"
          ? likedFeedPosts
          : feedPosts;
  const hasNextActivePage =
    activeTab === "home"
      ? hasNextHomePage
      : activeTab === "following"
        ? hasNextFollowingPage
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

  useEffect(() => {
    setFollowingFeedPosts(initialFollowingPosts.map(toFeedPost));
    setFollowingNextCursor(initialFollowingNextCursor);
    setHasNextFollowingPage(initialFollowingHasNext);
    setLoadError(null);
  }, [
    initialFollowingPosts,
    initialFollowingNextCursor,
    initialFollowingHasNext,
  ]);

  const loadMorePosts = useCallback(async () => {
    const endpoint =
      activeTab === "home"
        ? "/api/posts"
        : activeTab === "following"
          ? "/api/users/me/following/posts"
          : activeTab === "liked"
            ? "/api/users/me/liked-posts"
            : null;
    const cursor =
      activeTab === "home"
        ? homeNextCursor
        : activeTab === "following"
          ? followingNextCursor
          : likedNextCursor;

    if (
      !endpoint ||
      !hasNextActivePage ||
      !cursor ||
      isLoadingMoreRef.current
    ) {
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
        setHomePosts((current) => [...current, ...page.posts.map(toFeedPost)]);
        setHomeNextCursor(page.nextCursor);
        setHasNextHomePage(page.hasNext);
      } else if (activeTab === "following") {
        setFollowingFeedPosts((current) => [
          ...current,
          ...page.posts.map(toFeedPost),
        ]);
        setFollowingNextCursor(page.nextCursor);
        setHasNextFollowingPage(page.hasNext);
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
  }, [
    activeTab,
    followingNextCursor,
    hasNextActivePage,
    homeNextCursor,
    likedNextCursor,
  ]);

  useEffect(() => {
    if (
      (activeTab !== "home" &&
        activeTab !== "following" &&
        activeTab !== "liked") ||
      !hasNextActivePage
    ) {
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
    <div
      className={cn(
        "flex min-h-dvh flex-col text-zinc-950",
        activeTab === "workspace" || activeTab === "explore"
          ? "bg-zinc-50"
          : "bg-white",
      )}
    >
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
          isLoggedIn={isLoggedIn}
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
            activeTab === "workspace" || activeTab === "explore"
              ? "bg-zinc-50"
              : activeTab === "home" && isLoggedIn
                ? "bg-zinc-50"
                : "bg-white",
            isSidebarOpen ? "lg:ml-[282px]" : "lg:ml-0",
          )}
        >
          <section
            aria-label={
              activeTab === "workspace"
                ? "Workspace"
                : activeTab === "explore"
                  ? "Explore"
                  : "New posts"
            }
            className={cn(
              "mx-auto w-full pb-16 pt-6",
              activeTab === "workspace" || activeTab === "explore"
                ? "max-w-[1180px] px-4 sm:px-6 lg:px-8 xl:px-10"
                : activeTab === "home" && isLoggedIn
                  ? "max-w-[1180px] px-4 sm:px-6 lg:px-8 xl:px-10"
                  : "max-w-[1012px] px-5 sm:px-8 lg:px-12",
            )}
          >
            {activeTab === "home" && !isLoggedIn ? (
              <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-4 text-[15px] font-semibold text-zinc-950">
                <IconClock className="size-5 text-zinc-600" />
                <h1>Recent</h1>
              </div>
            ) : null}

            {activeTab === "workspace" ? (
              <WorkspaceView isLoggedIn={isLoggedIn} />
            ) : activeTab === "explore" ? (
              <ExploreView posts={posts} />
            ) : activeTab === "home" && isLoggedIn ? (
              <>
                <PostsView posts={posts} />
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
                        ? "No posts yet."
                        : hasNextActivePage
                          ? ""
                          : "No more posts."}
                </div>
              </>
            ) : (
              <>
                <div className="divide-y divide-zinc-200/80">
                  {posts.map((post) => (
                    <ArticleCard key={post.id} post={post} />
                  ))}
                </div>

                {activeTab === "home" ||
                activeTab === "following" ||
                activeTab === "liked" ? (
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
                            : activeTab === "following" && !isLoggedIn
                              ? "Log in to see following posts."
                              : "No posts yet."
                          : hasNextActivePage
                            ? ""
                            : "No more posts."}
                  </div>
                ) : null}
              </>
            )}
          </section>
        </main>
      </div>

      <div
        className={cn(
          "transition-[margin] duration-300 ease-out",
          isSidebarOpen ? "lg:ml-[282px]" : "lg:ml-0",
        )}
      >
        {footer}
      </div>
    </div>
  );
}

export function HomeSidebar({
  activeTab,
  isLoggedIn,
  isOpen,
  onNavigate,
  workspaceNav = "dashboard",
  logsFilter = "all",
  settingsNav,
}: {
  activeTab: TabKey;
  isLoggedIn: boolean;
  isOpen: boolean;
  onNavigate: () => void;
  workspaceNav?: "dashboard" | "tasks" | "logs";
  logsFilter?: LogListTypeFilter;
  settingsNav?: "mcp-guide";
}) {
  return (
    <aside
      aria-label="Workspace navigation"
      className={cn(
        "fixed bottom-0 left-0 top-16 z-40 w-[282px] border-r border-t border-zinc-200/70 bg-white transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <nav className="flex h-full flex-col overflow-y-auto px-3 py-4">
        <WorkspaceSwitcher isLoggedIn={isLoggedIn} onNavigate={onNavigate} />

        <SidebarSection label="WORKSPACE">
          <SidebarLink
            href={getTabHref("workspace", isLoggedIn)}
            label="Dashboard"
            active={activeTab === "workspace" && workspaceNav === "dashboard"}
            icon={<IconDashboard className="size-[15px]" />}
            onNavigate={onNavigate}
          />
          <SidebarLink
            href={getTasksHref()}
            label="Tasks"
            badge={countDoingTasks() > 0 ? String(countDoingTasks()) : undefined}
            active={workspaceNav === "tasks"}
            icon={<IconTasks className="size-[15px]" />}
            onNavigate={onNavigate}
          />
          <SidebarLogsGroup
            logsFilter={logsFilter}
            active={workspaceNav === "logs"}
            onNavigate={onNavigate}
          />
          <SidebarLink
            href={getTabHref("workspace", isLoggedIn)}
            label="Planner"
            icon={<IconPlanner className="size-[15px]" />}
            onNavigate={onNavigate}
          />
          <SidebarLink
            href={getTabHref("workspace", isLoggedIn)}
            label="Graph"
            icon={<IconGraph className="size-[15px]" />}
            onNavigate={onNavigate}
          />
          <SidebarLink
            href={getTabHref("workspace", isLoggedIn)}
            label="Outputs"
            icon={<IconBox className="size-[15px]" />}
            onNavigate={onNavigate}
          />
          <SidebarLink
            href={getTabHref("workspace", isLoggedIn)}
            label="Memory"
            icon={<IconDatabase className="size-[15px]" />}
            onNavigate={onNavigate}
          />
        </SidebarSection>

        <SidebarSection label="PUBLISHING">
          <SidebarLink
            href={getTabHref("home", isLoggedIn)}
            label="Posts"
            active={
              activeTab === "home" ||
              activeTab === "following" ||
              activeTab === "liked"
            }
            badge="2"
            icon={<IconGlobe className="size-[15px]" />}
            onNavigate={onNavigate}
          />
        </SidebarSection>

        <SidebarSection label="DISCOVER">
          <SidebarLink
            href={getTabHref("explore", isLoggedIn)}
            label="Explore"
            active={activeTab === "explore"}
            icon={<IconCompass className="size-[15px]" />}
            onNavigate={onNavigate}
          />
        </SidebarSection>

        <SidebarSection label="SETTINGS">
          <SidebarLink
            href={getMcpGuideHref()}
            label="MCP Guide"
            active={settingsNav === "mcp-guide"}
            icon={<IconMcpGuide className="size-[15px]" />}
            onNavigate={onNavigate}
          />
        </SidebarSection>

        <div className="mt-auto border-t border-zinc-200/70 px-2 pt-4 text-[11.5px] leading-5 text-zinc-500">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-zinc-950">
            <span className="size-[7px] rounded-full bg-green-600" />
            MCP connected
          </div>
          <div className="mt-1 text-zinc-400">
            {isLoggedIn
              ? "Claude Code · last read 4m ago"
              : "Connect CLI to capture logs"}
          </div>
          <code className="font-mono text-[10.5px] text-zinc-400">
            openlog-cli v0.4.2
          </code>
        </div>
      </nav>
    </aside>
  );
}

function SidebarLogsGroup({
  logsFilter = "all",
  active = false,
  onNavigate,
}: {
  logsFilter?: LogListTypeFilter;
  active?: boolean;
  onNavigate: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <Link
        href={getLogsHref(logsFilter)}
        onClick={onNavigate}
        className={cn(
          "flex h-8 w-full items-center gap-2.5 rounded-[10px] px-2 text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
          active
            ? "bg-zinc-100 font-semibold text-zinc-950"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950",
        )}
      >
        <IconFileText
          className={cn(
            "size-[15px] shrink-0",
            active ? "text-zinc-950" : "text-zinc-400",
          )}
        />
        <span className="min-w-0 flex-1 truncate text-left">Logs</span>
        <span className="rounded-full bg-zinc-100 px-2 text-[11px] font-semibold tabular-nums text-zinc-500">
          {workspaceLogs.length}
        </span>
        <button
          type="button"
          aria-label={isOpen ? "Collapse logs menu" : "Expand logs menu"}
          aria-expanded={isOpen}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsOpen((current) => !current);
          }}
          className="grid size-6 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-200/70 hover:text-zinc-700"
        >
          <IconChevronDown
            className={cn(
              "size-3 transition-transform duration-150",
              !isOpen && "-rotate-90",
            )}
          />
        </button>
      </Link>

      {isOpen ? (
        <div className="mb-1 ml-[22px] flex flex-col gap-px border-l border-zinc-200 pl-[7px]">
          {logsSubnavItems.map((item) => {
            const count = countLogsByType(item.key);
            const badge =
              item.key === "issues" && countOpenIssues() > 0
                ? String(countOpenIssues())
                : undefined;

            return (
              <Link
                key={item.key}
                href={getLogsHref(item.key)}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-[9px] py-[5px] text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                  active && logsFilter === item.key
                    ? "bg-zinc-100 font-semibold text-zinc-950"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {badge ? (
                  <span className="rounded-full bg-amber-50 px-[7px] text-[10.5px] font-semibold tabular-nums text-amber-700">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </>
  );
}

function SidebarSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="px-2 pb-1.5 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon,
  active = false,
  badge,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  badge?: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-[10px] px-2 text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        active
          ? "bg-zinc-100 font-semibold text-zinc-950"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950",
      )}
    >
      <span
        className={cn(
          "shrink-0",
          active ? "text-zinc-950" : "text-zinc-400",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? (
        <span
          className={cn(
            "rounded-full px-2 text-[11px] font-semibold tabular-nums",
            active ? "bg-white text-zinc-500" : "bg-zinc-100 text-zinc-500",
          )}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function PostsView({ posts }: { posts: FeedPost[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
      <div className="flex gap-6 border-b border-zinc-200/70 px-5">
        {["Published", "Drafts"].map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={cn(
              "relative py-3 text-[13.5px] font-medium transition-colors",
              index === 0
                ? "text-zinc-950 after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:bg-zinc-950"
                : "text-zinc-500 hover:text-zinc-950",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="divide-y divide-zinc-200/70">
        {posts.map((post) => (
          <FeedArticleCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

function ExploreView({ posts }: { posts: FeedPost[] }) {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
      <section className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
        <div className="flex gap-6 border-b border-zinc-200/70 px-5">
          {["Trending", "Recent", "Following"].map((tab, index) => (
            <button
              key={tab}
              type="button"
              className={cn(
                "relative py-3 text-[13.5px] font-medium transition-colors",
                index === 0
                  ? "text-zinc-950 after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:bg-zinc-950"
                  : "text-zinc-500 hover:text-zinc-950",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="divide-y divide-zinc-200/70">
          {posts.map((post) => (
            <FeedArticleCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-zinc-200/70 bg-white">
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
              TOP CONTRIBUTORS
            </h2>
            <IconPullRequest className="size-[15px] text-zinc-400" />
          </div>
          <div className="pb-2 pt-2">
            {topContributors.map((person) => (
              <div
                key={person.name}
                className="flex items-center gap-3 border-t border-zinc-100 px-5 py-3 first:border-t-0"
              >
                <Image
                  src={person.avatar}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 shrink-0 rounded-full border border-zinc-200 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-zinc-950">
                    {person.name}
                  </div>
                  <div className="truncate text-[11.5px] text-zinc-500">
                    {person.summary}
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-blue-700 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                >
                  Follow
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/70 bg-white">
          <div className="px-5 pt-4">
            <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
              TRENDING TOPICS
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 px-5 pb-5 pt-3">
            {recommendedTopics.map((topic) => (
              <Link
                key={topic}
                href={`/topics/${encodeURIComponent(topic.toLowerCase())}`}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[12px] font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                {topic}
              </Link>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function ArticleCard({ post }: { post: FeedPost }) {
  const thumbnailSrc = post.thumbnailSrc;

  return (
    <article className="py-8">
      <Link
        href={post.href}
        className={cn(
          "group grid gap-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
          thumbnailSrc
            ? "sm:grid-cols-[minmax(0,1fr)_184px] sm:items-center"
            : "",
        )}
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

        {thumbnailSrc ? (
          <div className="relative h-[126px] w-full overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 sm:h-[118px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailSrc}
              alt=""
              loading="lazy"
              className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          </div>
        ) : null}
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
    thumbnailSrc: post.thumbnailSrc,
    href: buildPublicPostPath(post.authorUsername, post.slug),
  };
}

function formatCompactCount(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="3.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="13.5"
        y="3.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="3.5"
        y="13.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="13.5"
        y="13.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconFileText({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 13h6M9 17h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconTasks({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconPlanner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="4"
        y="5"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 3v4M16 3v4M4 10h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconGraph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6 8.5v7M8.5 6.6c4 .8 7 2.6 7 4.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBox({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="m21 8-9-5-9 5 9 5 9-5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M3 8v8l9 5 9-5V8M12 13v8"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconDatabase({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="5.5" rx="8" ry="2.8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4 5.5V18c0 1.6 3.6 2.8 8 2.8s8-1.2 8-2.8V5.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 12c0 1.6 3.6 2.8 8 2.8s8-1.2 8-2.8"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3.5 12h17M12 3.5c2.3 2.3 3.5 5.2 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.2-3.5-8.5s1.2-6.2 3.5-8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconCompass({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m15.5 8.5-2 5-5 2 2-5 5-2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconMcpGuide({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 6h8M8 10h8M8 14h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16 18l2 2 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconPullRequest({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6 8.5v7M18 15.5V10a4 4 0 0 0-4-4h-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
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
