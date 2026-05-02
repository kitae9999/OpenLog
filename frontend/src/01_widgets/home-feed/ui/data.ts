import { assets } from "@/shared/config/assets";

export type TabKey = "home" | "following";

export type FeedPost = {
  id: string;
  author: string;
  publication?: string;
  title: string;
  description: string;
  dateLabel: string;
  readCount: string;
  commentCount: string;
  thumbnailSrc: string;
  href: string;
};

export const tabs: Array<{
  key: TabKey;
  label: string;
}> = [
  { key: "home", label: "Home" },
  { key: "following", label: "Following" },
];

export const feedPosts: FeedPost[] = [
  {
    id: "operational-notes",
    author: "Mina Park",
    publication: "OpenLog Engineering",
    title: "Operational Notes That Survive the Sprint",
    description:
      "A practical way to turn short-lived implementation details into durable context for the next person reading the system.",
    dateLabel: "May 2",
    readCount: "1.8K",
    commentCount: "24",
    thumbnailSrc: "/feed/operational-notes.svg",
    href: "/@minapark/posts/operational-notes",
  },
  {
    id: "review-cadence",
    author: "Jinwoo Lee",
    publication: "Product Systems",
    title: "The Review Cadence That Keeps Product Debt Visible",
    description:
      "Most teams only notice product debt when it blocks release. A lightweight weekly ritual makes the tradeoffs visible earlier.",
    dateLabel: "Apr 29",
    readCount: "892",
    commentCount: "11",
    thumbnailSrc: "/feed/review-cadence.svg",
    href: "/@jinwoolee/posts/review-cadence",
  },
  {
    id: "knowledge-graph",
    author: "Hannah Kim",
    title: "Designing a Knowledge Graph People Actually Use",
    description:
      "The useful graph is not the densest one. It is the one that connects decisions, owners, and follow-up work without ceremony.",
    dateLabel: "Apr 24",
    readCount: "3.4K",
    commentCount: "37",
    thumbnailSrc: "/feed/knowledge-graph.svg",
    href: "/@hannahkim/posts/knowledge-graph",
  },
  {
    id: "quiet-interfaces",
    author: "Alex Cho",
    publication: "Interface Notes",
    title: "Quiet Interfaces for Repeated Work",
    description:
      "A look at dense, predictable screens that respect operators by staying out of the way after the first week.",
    dateLabel: "Apr 18",
    readCount: "756",
    commentCount: "8",
    thumbnailSrc: "/feed/quiet-interfaces.svg",
    href: "/@alexcho/posts/quiet-interfaces",
  },
];

export const followingPosts: FeedPost[] = feedPosts.slice(1, 4);

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
