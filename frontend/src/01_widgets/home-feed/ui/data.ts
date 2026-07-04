import { assets } from "@/shared/config/assets";

export type TabKey = "workspace" | "home" | "following" | "liked";

export type FeedPost = {
  id: string;
  nickname: string;
  profileImageSrc: string;
  title: string;
  description: string;
  dateLabel: string;
  commentCount: string;
  likeCount: string;
  thumbnailSrc?: string | null;
  href: string;
};

export type WorkspaceItemKind = "draft" | "review" | "stale" | "published";

export type WorkspaceItem = {
  id: string;
  kind: WorkspaceItemKind;
  title: string;
  description: string;
  meta: string;
  href: string;
  progressLabel: string;
  countLabel: string;
};

export type WorkspaceMetric = {
  label: string;
  value: string;
  description: string;
};

const sidebarTabs: Array<{ key: TabKey; label: string }> = [
  { key: "workspace", label: "Workspace" },
  { key: "home", label: "Home" },
  { key: "following", label: "Following" },
  { key: "liked", label: "Liked" },
];

export function getDefaultTab(isLoggedIn: boolean): TabKey {
  return isLoggedIn ? "workspace" : "home";
}

export function getSidebarTabs(isLoggedIn: boolean) {
  const order: TabKey[] = isLoggedIn
    ? ["workspace", "home", "following", "liked"]
    : ["home", "workspace", "following", "liked"];

  return order.map(
    (key) => sidebarTabs.find((tab) => tab.key === key)!,
  );
}

export function getTabHref(tab: TabKey, isLoggedIn: boolean) {
  return tab === getDefaultTab(isLoggedIn) ? "/" : `/?tab=${tab}`;
}

/** @deprecated Use getSidebarTabs(isLoggedIn) instead */
export const tabs = sidebarTabs;

export const workspaceMetrics: WorkspaceMetric[] = [
  {
    label: "Drafts",
    value: "3",
    description: "AI sessions waiting to become posts",
  },
  {
    label: "Suggestions",
    value: "5",
    description: "Open review threads on your writing",
  },
  {
    label: "Freshness",
    value: "87%",
    description: "Public posts verified this quarter",
  },
];

export const workspaceItems: WorkspaceItem[] = [
  {
    id: "mcp-til",
    kind: "draft",
    title: "Turn today's Codex session into a TIL draft",
    description:
      "The error, fix path, and final code context are grouped into a publishable draft.",
    meta: "Generated from CLI session · 12 min ago",
    href: "/write",
    progressLabel: "Draft",
    countLabel: "4 sections",
  },
  {
    id: "ai-review",
    kind: "review",
    title: "AI review suggestions for the React 19 migration note",
    description:
      "Two suggested edits are waiting: one deprecated API note and one code import fix.",
    meta: "AI reviewer · Open suggestions",
    href: "/write",
    progressLabel: "Review",
    countLabel: "2 PRs",
  },
  {
    id: "stale-api",
    kind: "stale",
    title: "Re-verify freshness for the Next.js cache article",
    description:
      "It has been 91 days since the last check. Refreshing the verified date makes search traffic more trustworthy.",
    meta: "Freshness check · Due today",
    href: "/write",
    progressLabel: "Stale",
    countLabel: "91 days",
  },
  {
    id: "published-openlog",
    kind: "published",
    title: "Writing debugging notes with OpenLog MCP",
    description:
      "Published publicly. Readers can inspect the article, and contributors can improve it through the same PR-style flow.",
    meta: "Published · Verified Jul 4",
    href: "/write",
    progressLabel: "Public",
    countLabel: "312 views",
  },
];

export const feedPosts: FeedPost[] = [
  {
    id: "operational-notes",
    nickname: "Mina Park",
    profileImageSrc: assets.avatarA,
    title: "Operational Notes That Survive the Sprint",
    description:
      "A practical way to turn short-lived implementation details into durable context for the next person reading the system.",
    dateLabel: "May 2",
    commentCount: "24",
    likeCount: "1.8K",
    thumbnailSrc: "/feed/operational-notes.svg",
    href: "/@minapark/posts/operational-notes",
  },
  {
    id: "review-cadence",
    nickname: "Jinwoo Lee",
    profileImageSrc: assets.avatarB,
    title: "The Review Cadence That Keeps Product Debt Visible",
    description:
      "Most teams only notice product debt when it blocks release. A lightweight weekly ritual makes the tradeoffs visible earlier.",
    dateLabel: "Apr 29",
    commentCount: "11",
    likeCount: "892",
    thumbnailSrc: "/feed/review-cadence.svg",
    href: "/@jinwoolee/posts/review-cadence",
  },
  {
    id: "knowledge-graph",
    nickname: "Hannah Kim",
    profileImageSrc: assets.defaultAvatar,
    title: "Designing a Knowledge Graph People Actually Use",
    description:
      "The useful graph is not the densest one. It is the one that connects decisions, owners, and follow-up work without ceremony.",
    dateLabel: "Apr 24",
    commentCount: "37",
    likeCount: "3.4K",
    thumbnailSrc: "/feed/knowledge-graph.svg",
    href: "/@hannahkim/posts/knowledge-graph",
  },
  {
    id: "quiet-interfaces",
    nickname: "Alex Cho",
    profileImageSrc: assets.avatarA,
    title: "Quiet Interfaces for Repeated Work",
    description:
      "A look at dense, predictable screens that respect operators by staying out of the way after the first week.",
    dateLabel: "Apr 18",
    commentCount: "8",
    likeCount: "756",
    thumbnailSrc: "/feed/quiet-interfaces.svg",
    href: "/@alexcho/posts/quiet-interfaces",
  },
];

export const likedPosts: FeedPost[] = [feedPosts[0], feedPosts[2]];

export const recommendedTopics = [
  "React",
  "System Design",
  "Rust",
  "AI/ML",
  "DevOps",
  "GraphQL",
  "Accessibility",
] as const;

export const topContributors = [
  {
    name: "Dan Abramov",
    summary: "Merged 42 PRs this week",
    avatar: assets.avatarA,
  },
  {
    name: "Sarah Drasner",
    summary: "Published 8 architecture notes",
    avatar: assets.avatarB,
  },
  {
    name: "Kent C. Dodds",
    summary: "Reviewed 15 implementation logs",
    avatar: assets.avatarA,
  },
] as const;
