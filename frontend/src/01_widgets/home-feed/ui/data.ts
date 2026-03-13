import { openLogAssets } from "@/shared/config/openLogAssets";

export type TabKey = "trending" | "latest" | "following";

export const tabs: Array<{
  key: TabKey;
  label: string;
  iconSrc: string;
}> = [
  { key: "trending", label: "Trending", iconSrc: "/TrendingUp.svg" },
  { key: "latest", label: "Latest", iconSrc: "/BookOpen.svg" },
  { key: "following", label: "Following", iconSrc: "/Users.svg" },
];

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
