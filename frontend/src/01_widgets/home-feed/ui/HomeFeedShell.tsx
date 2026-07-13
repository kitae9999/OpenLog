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
import { LockIcon } from "@/shared/ui/icons";
import {
  feedPosts,
  getActivityHref,
  getLogsHref,
  getManageHref,
  getMemoryHref,
  getMcpGuideHref,
  getOutputsHref,
  getTabHref,
  getTasksHref,
  getWorkspaceGraphHref,
  logsSubnavItems,
  recommendedTopics,
  topContributors,
  type FeedPost,
  type LogListTypeFilter,
  type TabKey,
} from "./data";
import { WorkspaceView } from "./WorkspaceView";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { FeedArticleCard } from "./FeedArticleCard";
import type {
  ManagedWorkspace,
  WorkspaceActivity,
  WorkspaceUiData,
} from "./workspaceTypes";

type ExploreTabKey = "trending" | "recent" | "following" | "liked";
type ExploreSubTab = Exclude<ExploreTabKey, "trending">;

const SHOW_EXPLORE_INSIGHTS = false;

const exploreTabs: Array<{
  key: ExploreTabKey;
  label: string;
  hidden?: boolean;
  loginRequired?: boolean;
}> = [
  { key: "trending", label: "Trending", hidden: true },
  { key: "recent", label: "Recent" },
  { key: "following", label: "Following", loginRequired: true },
  { key: "liked", label: "Liked", loginRequired: true },
] as const;

function getExploreEmptyMessage(
  subTab: ExploreSubTab,
  isLoggedIn: boolean,
) {
  if (!isLoggedIn || subTab === "recent") {
    return "No posts yet.";
  }

  if (subTab === "following") {
    return "No posts from people you follow yet.";
  }

  if (subTab === "liked") {
    return "No liked posts yet.";
  }

  return "No posts yet.";
}

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
  workspaces = [],
  workspaceData,
  workspaceActivity,
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
  workspaces?: ManagedWorkspace[];
  workspaceData?: WorkspaceUiData | null;
  workspaceActivity?: WorkspaceActivity | null;
  footer: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [exploreSubTab, setExploreSubTab] = useState<ExploreSubTab>("recent");
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
  const activeFeed =
    activeTab === "home" ||
    (activeTab === "explore" && (!isLoggedIn || exploreSubTab === "recent"))
      ? "recent"
      : activeTab === "following" ||
          (activeTab === "explore" && exploreSubTab === "following")
        ? "following"
        : activeTab === "liked" ||
            (activeTab === "explore" && exploreSubTab === "liked")
          ? "liked"
          : null;
  const posts =
    activeFeed === "recent"
      ? homePosts
      : activeFeed === "following"
        ? followingFeedPosts
        : activeFeed === "liked"
          ? likedFeedPosts
          : feedPosts;
  const hasNextActivePage =
    activeFeed === "recent"
      ? hasNextHomePage
      : activeFeed === "following"
        ? hasNextFollowingPage
        : activeFeed === "liked"
          ? hasNextLikedPage
          : false;
  const supportsInfiniteScroll =
    activeTab === "home" ||
    activeTab === "following" ||
    activeTab === "liked" ||
    activeTab === "explore";

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
      activeFeed === "recent"
        ? "/api/posts"
        : activeFeed === "following"
          ? "/api/users/me/following/posts"
          : activeFeed === "liked"
            ? "/api/users/me/liked-posts"
            : null;
    const cursor =
      activeFeed === "recent"
        ? homeNextCursor
        : activeFeed === "following"
          ? followingNextCursor
          : activeFeed === "liked"
            ? likedNextCursor
            : null;

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

      if (activeFeed === "recent") {
        setHomePosts((current) => [...current, ...page.posts.map(toFeedPost)]);
        setHomeNextCursor(page.nextCursor);
        setHasNextHomePage(page.hasNext);
      } else if (activeFeed === "following") {
        setFollowingFeedPosts((current) => [
          ...current,
          ...page.posts.map(toFeedPost),
        ]);
        setFollowingNextCursor(page.nextCursor);
        setHasNextFollowingPage(page.hasNext);
      } else if (activeFeed === "liked") {
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
    activeFeed,
    followingNextCursor,
    hasNextActivePage,
    homeNextCursor,
    likedNextCursor,
  ]);

  useEffect(() => {
    if (!isLoggedIn && exploreSubTab !== "recent") {
      setExploreSubTab("recent");
    }
  }, [exploreSubTab, isLoggedIn]);

  useEffect(() => {
    if (!supportsInfiniteScroll || !activeFeed || !hasNextActivePage) {
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
  }, [activeFeed, hasNextActivePage, loadMorePosts, supportsInfiniteScroll]);

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col text-zinc-950",
        activeTab === "workspace" || activeTab === "explore"
          ? "bg-app"
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
          workspaces={workspaces}
          workspaceData={workspaceData}
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
              ? "bg-app"
              : activeTab === "home" && isLoggedIn
                ? "bg-app"
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
              <div className="mx-auto w-full max-w-[920px]">
                <header className="pb-6">
                  <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
                    Recent
                  </h1>
                  <p className="mt-1.5 text-[13px] text-zinc-500">
                    Latest posts across OpenLog
                  </p>
                </header>
              </div>
            ) : null}

            {activeTab === "workspace" ? (
              <WorkspaceView
                isLoggedIn={isLoggedIn}
                workspaceData={workspaceData}
                activity={workspaceActivity}
              />
            ) : activeTab === "explore" ? (
              <ExploreView
                posts={posts}
                isLoggedIn={isLoggedIn}
                activeSubTab={exploreSubTab}
                onSubTabChange={(tab) => {
                  setExploreSubTab(tab);
                  setLoadError(null);
                }}
                loadMore={
                  <div
                    ref={sentinelRef}
                    className="mt-6 flex min-h-16 items-center pl-5 text-sm text-zinc-500"
                    aria-live="polite"
                  >
                    {isLoadingMore
                      ? "Loading posts..."
                      : loadError
                        ? loadError
                        : posts.length === 0
                          ? getExploreEmptyMessage(exploreSubTab, isLoggedIn)
                          : hasNextActivePage
                            ? ""
                            : "No more posts."}
                  </div>
                }
              />
            ) : activeTab === "home" && isLoggedIn ? (
              <>
                <PostsView posts={posts} />
                <div
                  ref={sentinelRef}
                  className="mt-6 flex min-h-16 items-center pl-5 text-sm text-zinc-500"
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
              <div className="mx-auto w-full max-w-[920px]">
                <div>
                  {posts.map((post) => (
                    <FeedArticleCard key={post.id} post={post} />
                  ))}
                </div>

                {activeTab === "home" ||
                activeTab === "following" ||
                activeTab === "liked" ? (
                  <div
                    ref={sentinelRef}
                    className="mt-6 flex min-h-16 items-center pl-5 text-sm text-zinc-500"
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
              </div>
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
  workspaces = [],
  workspaceData,
}: {
  activeTab: TabKey;
  isLoggedIn: boolean;
  isOpen: boolean;
  onNavigate: () => void;
  workspaceNav?: "dashboard" | "tasks" | "logs" | "planner" | "graph" | "outputs" | "memory" | "activity";
  logsFilter?: LogListTypeFilter;
  settingsNav?: "mcp-guide" | "manage";
  workspaces?: ManagedWorkspace[];
  workspaceData?: WorkspaceUiData | null;
}) {
  const sidebarTasks = isLoggedIn
    ? (workspaceData?.tasks ?? [])
    : [];
  const sidebarLogs = isLoggedIn
    ? (workspaceData?.logs ?? [])
    : [];
  const doingTaskCount =
    sidebarTasks.filter((task) => task.status === "doing").length ||
    sidebarTasks.filter((task) => task.status === "todo").length;
  const logsCount = sidebarLogs.length;
  const openIssuesCount = sidebarLogs.filter(
    (log) => log.label.toLowerCase() === "issue" && log.status !== "CLOSED",
  ).length;

  return (
    <aside
      aria-label="Workspace navigation"
      className={cn(
        "fixed bottom-0 left-0 top-16 z-40 w-[282px] border-r border-t border-zinc-200/70 bg-white transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <nav className="flex h-full flex-col overflow-y-auto px-3 py-4">
        <WorkspaceSwitcher
          isLoggedIn={isLoggedIn}
          workspaces={workspaces}
          activeWorkspaceId={workspaceData?.workspaceId}
          onNavigate={onNavigate}
        />

        <SidebarSection label="WORKSPACE">
          {isLoggedIn ? (
            <>
              <SidebarLink
                href={getTabHref("workspace", isLoggedIn)}
                label="Dashboard"
                active={
                  activeTab === "workspace" && workspaceNav === "dashboard"
                }
                icon={<IconDashboard className="size-[15px]" />}
                onNavigate={onNavigate}
              />
              <SidebarLink
                href={getTasksHref()}
                label="Tasks"
                badge={doingTaskCount > 0 ? String(doingTaskCount) : undefined}
                active={workspaceNav === "tasks"}
                icon={<IconTasks className="size-[15px]" />}
                onNavigate={onNavigate}
              />
              <SidebarLogsGroup
                logsFilter={logsFilter}
                active={workspaceNav === "logs"}
                logsCount={logsCount}
                openIssuesCount={openIssuesCount}
                onNavigate={onNavigate}
              />
              <SidebarLink
                href={getActivityHref()}
                label="Activity"
                active={workspaceNav === "activity"}
                icon={<IconActivity className="size-[15px]" />}
                onNavigate={onNavigate}
              />
              <SidebarLink
                href={getWorkspaceGraphHref()}
                label="Graph"
                active={workspaceNav === "graph"}
                icon={<IconGraph className="size-[15px]" />}
                onNavigate={onNavigate}
              />
              <SidebarLink
                href={getOutputsHref()}
                label="Outputs"
                active={workspaceNav === "outputs"}
                icon={<IconBox className="size-[15px]" />}
                onNavigate={onNavigate}
              />
              <SidebarLink
                href={getMemoryHref()}
                label="Memory"
                active={workspaceNav === "memory"}
                icon={<IconDatabase className="size-[15px]" />}
                onNavigate={onNavigate}
              />
            </>
          ) : (
            <SidebarLink
              href={getTabHref("workspace", isLoggedIn)}
              label="Workspace"
              badge="Sign in"
              active={activeTab === "workspace"}
              icon={<LockIcon className="size-[15px]" />}
              onNavigate={onNavigate}
            />
          )}
        </SidebarSection>

        {isLoggedIn ? (
          <SidebarSection label="PUBLISHING">
            <SidebarLink
              href={getTabHref("home", isLoggedIn)}
              label="Posts"
              active={
                activeTab === "home" ||
                activeTab === "following" ||
                activeTab === "liked"
              }
              icon={<IconGlobe className="size-[15px]" />}
              onNavigate={onNavigate}
            />
          </SidebarSection>
        ) : null}

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
          {isLoggedIn ? (
            <SidebarLink
              href={getManageHref()}
              label="Manage"
              active={settingsNav === "manage"}
              icon={<IconManage className="size-[15px]" />}
              onNavigate={onNavigate}
            />
          ) : null}
        </SidebarSection>
      </nav>
    </aside>
  );
}

function SidebarLogsGroup({
  logsFilter = "all",
  active = false,
  logsCount,
  openIssuesCount,
  onNavigate,
}: {
  logsFilter?: LogListTypeFilter;
  active?: boolean;
  logsCount: number;
  openIssuesCount: number;
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
          {logsCount}
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
            const badge =
              item.key === "issues" && openIssuesCount > 0
                ? String(openIssuesCount)
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
        className={cn("shrink-0", active ? "text-zinc-950" : "text-zinc-400")}
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
    <div className="mx-auto w-full max-w-[920px]">
      <header className="pb-6">
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
          Posts
        </h1>
        <p className="mt-1.5 text-[13px] text-zinc-500">
          {posts.length} published
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Post filters"
        className="flex flex-wrap items-end gap-1 border-b border-zinc-200"
      >
        {["Published", "Drafts"].map((tab, index) => {
          const active = index === 0;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                "relative h-9 px-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                active
                  ? "text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-800",
              )}
            >
              {tab}
              {active ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 bg-zinc-950" />
              ) : null}
            </button>
          );
        })}
      </div>

      {posts.length === 0 ? (
        <p className="mt-10 pl-5 text-sm text-zinc-500">No posts yet.</p>
      ) : (
        <ul className="mt-2">
          {posts.map((post) => (
            <li key={post.id}>
              <FeedArticleCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExploreView({
  posts,
  isLoggedIn,
  activeSubTab,
  onSubTabChange,
  loadMore,
}: {
  posts: FeedPost[];
  isLoggedIn: boolean;
  activeSubTab: ExploreSubTab;
  onSubTabChange: (tab: ExploreSubTab) => void;
  loadMore?: ReactNode;
}) {
  const visibleTabs = exploreTabs.filter(
    (
      tab,
    ): tab is (typeof exploreTabs)[number] & { key: ExploreSubTab } =>
      !tab.hidden &&
      tab.key !== "trending" &&
      (!tab.loginRequired || isLoggedIn),
  );

  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-[920px] items-start gap-10",
        SHOW_EXPLORE_INSIGHTS &&
          "max-w-[1180px] xl:grid-cols-[minmax(0,1fr)_280px]",
      )}
    >
      <div className="min-w-0">
        <header className="pb-6">
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
            Explore
          </h1>
          <p className="mt-1.5 text-[13px] text-zinc-500">
            Discover posts across OpenLog
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Explore filters"
          className="flex flex-wrap items-end gap-1 border-b border-zinc-200"
        >
          {visibleTabs.map((tab) => {
            const active = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSubTabChange(tab.key)}
                className={cn(
                  "relative inline-flex h-9 items-center gap-1.5 px-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                  active
                    ? "text-zinc-950"
                    : "text-zinc-500 hover:text-zinc-800",
                )}
              >
                <span
                  className={cn(
                    "shrink-0",
                    active ? "text-zinc-700" : "text-zinc-400",
                  )}
                >
                  {getExploreTabIcon(tab.key)}
                </span>
                {tab.label}
                {active ? (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 bg-zinc-950" />
                ) : null}
              </button>
            );
          })}
        </div>

        {posts.length === 0 ? null : (
          <ul className="mt-2">
            {posts.map((post) => (
              <li key={post.id}>
                <FeedArticleCard post={post} />
              </li>
            ))}
          </ul>
        )}
        {loadMore}
      </div>

      {SHOW_EXPLORE_INSIGHTS ? (
        <aside className="space-y-8 pt-1">
          <section>
            <div className="flex items-baseline justify-between gap-3 border-b border-zinc-200 pb-3">
              <h2 className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
                Top contributors
              </h2>
              <IconPullRequest className="size-[15px] text-zinc-400" />
            </div>
            <div className="mt-2">
              {topContributors.map((person) => (
                <div
                  key={person.name}
                  className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition hover:bg-zinc-50"
                >
                  <Image
                    src={person.avatar}
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 rounded-full border border-zinc-200 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-zinc-950">
                      {person.name}
                    </p>
                    <p className="truncate text-[12px] text-zinc-500">
                      {person.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <div className="border-b border-zinc-200 pb-3">
              <h2 className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
                Trending topics
              </h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {recommendedTopics.map((topic) => (
                <span
                  key={topic}
                  className="text-[13px] font-medium text-zinc-500"
                >
                  #{topic}
                </span>
              ))}
            </div>
          </section>
        </aside>
      ) : null}
    </div>
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

function IconActivity({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 16.5h3v3H4zM10.5 10.5h3v9h-3zM17 4.5h3v15h-3z"
        fill="currentColor"
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
      <ellipse
        cx="12"
        cy="5.5"
        rx="8"
        ry="2.8"
        stroke="currentColor"
        strokeWidth="1.8"
      />
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

function IconManage({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6M17.9 17.9l-1.6-1.6M7.7 7.7 6.1 6.1"
        stroke="currentColor"
        strokeLinecap="round"
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

function getExploreTabIcon(tab: (typeof exploreTabs)[number]["key"]) {
  const className = "size-[15px]";

  switch (tab) {
    case "recent":
      return <IconClock className={className} />;
    case "following":
      return <IconUsers className={className} />;
    case "liked":
      return <IconHeart className={className} />;
    default:
      return null;
  }
}
