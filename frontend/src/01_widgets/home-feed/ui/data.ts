import { assets } from "@/shared/config/assets";

export type TabKey = "workspace" | "explore" | "home" | "following" | "liked";

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

export type WorkspaceTone = "blue" | "green" | "amber" | "zinc";

export type WorkspaceLogItem = {
  id: string;
  tone: WorkspaceTone;
  label: string;
  title: string;
  description: string;
  meta: string;
  commit?: string;
  href: string;
};

export type WorkspaceMetric = {
  label: string;
  value: string;
  description: string;
  emphasis?: string;
  tone?: "positive" | "warning";
};

const sidebarTabs: Array<{ key: TabKey; label: string }> = [
  { key: "workspace", label: "Workspace" },
  { key: "explore", label: "Explore" },
  { key: "home", label: "Home" },
  { key: "following", label: "Following" },
  { key: "liked", label: "Liked" },
];

export function getDefaultTab(isLoggedIn: boolean): TabKey {
  return isLoggedIn ? "workspace" : "home";
}

export function getSidebarTabs(isLoggedIn: boolean) {
  const order: TabKey[] = isLoggedIn
    ? ["workspace", "explore", "home", "following", "liked"]
    : ["home", "explore", "workspace", "following", "liked"];

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
    label: "LOGS THIS WEEK",
    value: "14",
    description: "+5 vs last week",
    emphasis: "+5",
    tone: "positive",
  },
  {
    label: "DECISIONS CAPTURED",
    value: "3",
    description: "1 awaiting review",
    emphasis: "1",
  },
  {
    label: "OPEN TODOS",
    value: "5",
    description: "2 stale > 3d",
    emphasis: "2",
    tone: "warning",
  },
  {
    label: "READY TO PUBLISH",
    value: "2",
    description: "drafts generated",
  },
];

export const workspaceLogs: WorkspaceLogItem[] = [
  {
    id: "turbopack-pnpm",
    tone: "green",
    label: "Fix",
    title: "pnpm 전환 중 Turbopack 빌드 실패",
    description:
      "workspace 루트 추론이 lockfile 위치와 어긋나 발생. turbopack root 명시로 해결.",
    meta: "Today 14:20 · auto-captured · Claude Code",
    commit: "e092268",
    href: "/write",
  },
  {
    id: "terraform-state",
    tone: "blue",
    label: "Decision",
    title: "Terraform state를 GCS backend로 이전",
    description:
      "로컬 state 충돌과 유실 위험 때문에 원격 backend로 이전. 잠금은 GCS 기본 잠금을 사용하기로 결정.",
    meta: "Jun 30",
    commit: "c6c0c12",
    href: "/write",
  },
  {
    id: "iam-permissions",
    tone: "zinc",
    label: "Log",
    title: "IAM 최소 권한 정리 및 불일치 설정 수정",
    description:
      "배포 서비스 계정에서 과한 권한 3개 제거. editor를 세분화된 role로 교체.",
    meta: "Jun 29",
    commit: "e571dcb",
    href: "/write",
  },
];

export const workspaceDecisions = [
  {
    title: "홈 피드를 개인 워크스페이스로 전환",
    description: "이번 세션 대화에서 감지됨",
    status: "Review",
  },
  {
    title: "패키지 매니저 pnpm 채택",
    description: "브랜치명과 lockfile 변경에서 감지",
    status: "Today",
  },
  {
    title: "state 파일 GCS 저장",
    description: "커밋 c6c0c12에서 감지",
    status: "Jun 30",
  },
] as const;

export type WorkspaceWorkStatus = "doing" | "done" | "todo";

export type WorkspaceWorkItem = {
  id: string;
  title: string;
  description: string;
  status: WorkspaceWorkStatus;
  actionBadge?: string;
};

export const workspaceWorkItems: WorkspaceWorkItem[] = [
  {
    id: "workspace-view",
    title: "홈 피드 → 워크스페이스 뷰 전환",
    description: "doing · 5 logs · fix/pnpm",
    status: "doing",
    actionBadge: "Active",
  },
  {
    id: "pnpm-migration",
    title: "pnpm 마이그레이션",
    description: "doing · 7 logs · 2 open issues",
    status: "doing",
  },
  {
    id: "terraform-gcs",
    title: "Terraform state GCS 이전",
    description: "done Jun 30 · 4 logs",
    status: "done",
    actionBadge: "Generate output",
  },
  {
    id: "post-visibility",
    title: "post visibility 필드 도입",
    description: "todo · created from issue",
    status: "todo",
  },
];

export type WorkspaceTodoItem = {
  id: string;
  title: string;
  description?: string;
  done?: boolean;
};

export const workspaceTodos: WorkspaceTodoItem[] = [
  {
    id: "pnpm-cache",
    title: "CI에서 pnpm 캐시 키 갱신",
    description: "from log",
    done: true,
  },
  {
    id: "guest-prompt",
    title: "WorkspaceGuestPrompt 반응형 처리",
  },
  {
    id: "dashboard-grid",
    title: "대시보드 위젯 그리드 구현",
    description: "suggested by AI",
  },
];

export type WorkspaceGrassCell = {
  day: number | null;
  logCount: number;
  isToday?: boolean;
  isFuture?: boolean;
};

export const workspaceMonthLabel = "July 2026";

/** GitHub-style: each column is Mon→Sun (7 cells). */
export const workspaceMonthGrass: WorkspaceGrassCell[][] = [
  [
    { day: null, logCount: 0 },
    { day: null, logCount: 0 },
    { day: 1, logCount: 1 },
    { day: 2, logCount: 3 },
    { day: 3, logCount: 1 },
    { day: 4, logCount: 2, isToday: true },
    { day: 5, logCount: 0, isFuture: true },
  ],
  [
    { day: 6, logCount: 0, isFuture: true },
    { day: 7, logCount: 0, isFuture: true },
    { day: 8, logCount: 0, isFuture: true },
    { day: 9, logCount: 0, isFuture: true },
    { day: 10, logCount: 0, isFuture: true },
    { day: 11, logCount: 0, isFuture: true },
    { day: 12, logCount: 0, isFuture: true },
  ],
  [
    { day: 13, logCount: 0, isFuture: true },
    { day: 14, logCount: 0, isFuture: true },
    { day: 15, logCount: 0, isFuture: true },
    { day: 16, logCount: 0, isFuture: true },
    { day: 17, logCount: 0, isFuture: true },
    { day: 18, logCount: 0, isFuture: true },
    { day: 19, logCount: 0, isFuture: true },
  ],
  [
    { day: 20, logCount: 0, isFuture: true },
    { day: 21, logCount: 0, isFuture: true },
    { day: 22, logCount: 0, isFuture: true },
    { day: 23, logCount: 0, isFuture: true },
    { day: 24, logCount: 0, isFuture: true },
    { day: 25, logCount: 0, isFuture: true },
    { day: 26, logCount: 0, isFuture: true },
  ],
  [
    { day: 27, logCount: 0, isFuture: true },
    { day: 28, logCount: 0, isFuture: true },
    { day: 29, logCount: 0, isFuture: true },
    { day: 30, logCount: 0, isFuture: true },
    { day: 31, logCount: 0, isFuture: true },
    { day: null, logCount: 0 },
    { day: null, logCount: 0 },
  ],
];

export type WorkspaceIssue = {
  title: string;
  description: string;
};

export const workspaceIssues: WorkspaceIssue[] = [
  {
    title: "Turbopack HMR이 간헐적으로 끊김",
    description: "open 2d · fix/pnpm",
  },
  {
    title: "GCS state 잠금 충돌 시 재시도 없음",
    description: "open 5d",
  },
  {
    title: "모바일 사이드바 포커스 트랩 없음",
    description: "open 6d",
  },
];

export const logsSubnavItems = [
  { label: "All", badge: undefined },
  { label: "Issues", badge: "3" },
  { label: "Fixes", badge: undefined },
  { label: "Decisions", badge: undefined },
] as const;

export const workspaceOutputs = [
  {
    title: "PR document",
    description: "from 3 logs",
    kind: "pull-request",
  },
  {
    title: "Public post",
    description: "2 candidates",
    kind: "post",
  },
  {
    title: "Weekly recap",
    description: "14 logs this week",
    kind: "calendar",
  },
  {
    title: "Release notes",
    description: "since v0.5",
    kind: "release",
  },
] as const;

export const workspaceMemories = [
  {
    title: "인증은 device login flow로 처리",
    description: "CLI가 웹 승인 결과를 로컬 저장. 토큰 갱신은 서버 주도.",
    source: "auth",
    reads: "12 reads",
  },
  {
    title: "Turbopack root는 명시적으로 고정",
    description: "모노레포에서 lockfile 추론에 의존하지 않기.",
    source: "recipe",
    reads: "2 reads",
  },
] as const;

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
