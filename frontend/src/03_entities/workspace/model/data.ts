import { assets } from "@/shared/config/assets";
import {
  formatWorkspaceDateLabel,
  pickLatestIso,
} from "@/shared/lib/formatWorkspaceDateLabel";

export type TabKey = "workspace" | "explore" | "home" | "following" | "liked";

export type FeedPost = {
  id: string;
  status?: "draft" | "published" | "unpublished";
  nickname: string;
  profileImageSrc: string;
  authorIsOpenLogOfficial: boolean;
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
  kind?: "ISSUE" | "FIX" | "DECISION" | "NOTE";
  status?: "NONE" | "OPEN" | "CLOSED";
  title: string;
  description: string;
  summary?: string;
  meta: string;
  commit?: string;
  href: string;
  taskId?: string;
  /** Branch at capture time — independent of task. */
  branch?: string;
  /** Markdown recipe body. Falls back to generated content from description/recipe. */
  body?: string;
  createdAt?: string;
  /** Last edit time; Recent logs / list sort by this when present. */
  updatedAt?: string;
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
  return isLoggedIn ? "workspace" : "explore";
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
  if (tab === "workspace" && isLoggedIn) {
    return "/dashboard";
  }
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
    label: "TODAY TODO",
    value: "5",
    description: "2 stale > 3d",
    emphasis: "2",
    tone: "warning",
  },
  {
    label: "OUTPUTS READY",
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
    taskId: "pnpm-migration",
    branch: "fix/pnpm",
    body: `## Problem

npm에서 pnpm으로 전환한 뒤 next dev --turbopack 실행 시 모듈 해석 실패. 레포 루트가 아닌 frontend 하위에서만 재현.

\`\`\`
Error: Next.js package not found
  at resolveWorkspaceRoot (turbopack/…)
  lockfile detected at ../../pnpm-lock.yaml
\`\`\`

## Cause

Turbopack이 workspace 루트를 lockfile 위치로 추론하는데, 레포 루트의 pnpm-lock.yaml을 잡으면서 frontend 앱 기준 모듈 경로가 어긋남.

## Fix

next.config.ts에서 turbopack root를 frontend로 명시해 추론을 우회.

\`\`\`ts
// next.config.ts
const nextConfig = {
  turbopack: { root: __dirname },
};
\`\`\`

## Verification

dev·빌드 모두 통과. CI의 pnpm 캐시 키 갱신은 TODO로 남김.

## Related commits

\`e092268\` · fix: turbopack 버그 수정`,
  },
  {
    id: "workspace-tab-routing",
    tone: "zinc",
    label: "Log",
    title: "로그인 분기로 workspace 탭 기본 라우팅",
    description:
      "getDefaultTab·getTabHref 추가. 로그인 시 / → workspace, 비로그인 시 home.",
    meta: "Today 11:05 · auto-captured",
    commit: "a41f2e1",
    href: "/write",
    taskId: "workspace-view",
    branch: "fix/pnpm",
  },
  {
    id: "workspace-decision",
    tone: "blue",
    label: "Decision",
    title: "홈 피드를 개인 워크스페이스로 전환",
    description:
      "커뮤니티 피드 대신 로그인 시 workspace를 기본 탭으로. 비로그인은 Home.",
    meta: "Jun 28",
    commit: "d02a881",
    href: "/write",
    taskId: "workspace-view",
    branch: "fix/pnpm",
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
    taskId: "terraform-gcs",
    branch: "feat/terraform-gcs",
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
    branch: "main",
  },
  {
    id: "workspace-shell-layout",
    tone: "zinc",
    label: "Log",
    title: "HomeFeedShell footer 사이드바 오프셋",
    description:
      "사이드바 open 시 footer에 lg:ml-[282px] 적용해 겹침 제거.",
    meta: "Jun 28",
    commit: "b8c14fd",
    href: "/write",
    taskId: "workspace-view",
    branch: "feat/workspace-ui",
  },
  {
    id: "turbopack-hmr",
    tone: "amber",
    label: "Issue",
    title: "Turbopack HMR이 간헐적으로 끊김",
    description: "dev 서버 장시간 실행 후 HMR websocket이 끊기고 full reload 필요.",
    meta: "open 2d · fix/pnpm",
    href: "/write",
    taskId: "pnpm-migration",
    branch: "fix/pnpm",
  },
  {
    id: "gcs-lock-retry",
    tone: "amber",
    label: "Issue",
    title: "GCS state 잠금 충돌 시 재시도 없음",
    description: "동시 plan 실행 시 lock error 후 자동 retry 없이 CI job fail.",
    meta: "open 5d",
    href: "/write",
    taskId: "terraform-gcs",
    branch: "feat/terraform-gcs",
  },
  {
    id: "mobile-sidebar-focus",
    tone: "amber",
    label: "Issue",
    title: "모바일 사이드바 포커스 트랩 없음",
    description: "overlay open 상태에서 Tab이 배경으로 빠져나감.",
    meta: "open 6d",
    href: "/write",
    taskId: "workspace-view",
    branch: "feat/workspace-ui",
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
  description?: string | null;
  status: WorkspaceWorkStatus;
  apiStatus?: "TODO" | "DOING" | "DONE";
  body: string;
  /** Present for API-backed tasks; used for Started. */
  createdAt?: string;
  /** Present for API-backed tasks; used with linked log times for Updated. */
  updatedAt?: string;
};

export const workspaceWorkItems: WorkspaceWorkItem[] = [
  {
    id: "workspace-view",
    title: "홈 피드 → 워크스페이스 뷰 전환",
    status: "doing",
    body: `## Context

홈 피드 중심 UX에서 **워크스페이스 대시보드**로 피벗합니다. 로그인 사용자의 \`/\` 진입점을 작업 맥락이 한눈에 보이는 대시보드로 바꾸는 작업입니다.

## Goal

- 로그인 시 \`/\` → Workspace 탭
- TASKS · RECENT LOGS · TODOS 위젯 배치
- Task / Log 상세 페이지 라우팅

## Scope

**In**
- WorkspaceView 대시보드 카드
- Task detail · Log detail 라우트
- 사이드바 Workspace 네비게이션

**Out**
- 실제 API 연동
- Planner · Graph 풀 페이지

## Notes

디자인 기준: \`_docs/design/workspace-layout-preview.html\``,
  },
  {
    id: "pnpm-migration",
    title: "pnpm 마이그레이션",
    status: "doing",
    body: `## Context

npm lockfile과 CI 캐시를 pnpm workspace로 통일합니다. Turbopack·모노레포 경로 이슈가 함께 따라옵니다.

## Goal

- 루트 \`pnpm-lock.yaml\` 기준으로 install/dev/build 통일
- CI 캐시 키 갱신
- frontend dev 서버 정상 기동

## Scope

**In**
- package manager 전환
- next.config turbopack root 명시

**Out**
- publishable packages 분리
- Nx/Turbo 도입`,
  },
  {
    id: "terraform-gcs",
    title: "Terraform state GCS 이전",
    status: "done",
    body: `## Context

로컬 \`.terraform\` state를 팀 공유 GCS backend로 이전합니다.

## Goal

- remote state bucket + versioning
- CI plan/apply 파이프라인 연동

## Scope

**In**
- backend \`gcs\` block
- state lock (GCS native)

**Out**
- multi-env workspace split`,
  },
  {
    id: "post-visibility",
    title: "post visibility 필드 도입",
    status: "todo",
    body: "",
  },
];

export const activeWorkspaceTaskId = "workspace-view";

export const workspaceRepository = {
  owner: "kitae9999",
  name: "openlog",
  defaultBranch: "main",
} as const;

export function getWorkspaceRepositoryFullName() {
  return `${workspaceRepository.owner}/${workspaceRepository.name}`;
}

export function getWorkspaceRepositoryUrl() {
  return `https://github.com/${workspaceRepository.owner}/${workspaceRepository.name}`;
}

export function getTaskById(taskId: string) {
  return workspaceWorkItems.find((task) => task.id === taskId);
}

export function getLogsForTask(taskId: string) {
  return workspaceLogs.filter((log) => log.taskId === taskId);
}

export function countLogsForTask(taskId: string) {
  return getLogsForTask(taskId).length;
}

export function getLogHref(logId: string) {
  return `/logs/${logId}`;
}

export function getLogEditHref(logId: string) {
  return `/logs/${logId}/edit`;
}

export function recipeToMarkdown(
  recipe: WorkspaceLogRecipe,
  log?: WorkspaceLogItem,
): string {
  const sections: string[] = [`## Problem\n\n${recipe.problem}`];

  if (recipe.problemCode) {
    sections.push(`\`\`\`\n${recipe.problemCode}\n\`\`\``);
  }
  if (recipe.cause) {
    sections.push(`## Cause\n\n${recipe.cause}`);
  }
  if (recipe.fix) {
    sections.push(`## Fix\n\n${recipe.fix}`);
  }
  if (recipe.fixCode) {
    sections.push(`\`\`\`\n${recipe.fixCode}\n\`\`\``);
  }
  if (recipe.verification) {
    sections.push(`## Verification\n\n${recipe.verification}`);
  }
  if (log?.commit) {
    const commitLine = `\`${log.commit}\`${recipe.commitMessage ? ` · ${recipe.commitMessage}` : ""}`;
    sections.push(`## Related commits\n\n${commitLine}`);
  }

  return sections.join("\n\n");
}

export function getLogBody(log: WorkspaceLogItem): string {
  if (log.body?.trim()) {
    return log.body;
  }

  const recipe = getLogRecipe(log.id);
  if (recipe) {
    return recipeToMarkdown(recipe, log);
  }

  return `## Summary\n\n${log.description}`;
}

export function getLogById(logId: string) {
  return workspaceLogs.find((log) => log.id === logId);
}

export type WorkspaceLogRecipe = {
  problem: string;
  problemCode?: string;
  cause?: string;
  fix?: string;
  fixCode?: string;
  verification?: string;
  commitMessage?: string;
  source?: string;
  visibility?: string;
};

export const workspaceLogRecipes: Record<string, WorkspaceLogRecipe> = {
  "turbopack-pnpm": {
    problem:
      "npm에서 pnpm으로 전환한 뒤 next dev --turbopack 실행 시 모듈 해석 실패. 레포 루트가 아닌 frontend 하위에서만 재현.",
    problemCode: `Error: Next.js package not found
  at resolveWorkspaceRoot (turbopack/…)
  lockfile detected at ../../pnpm-lock.yaml`,
    cause:
      "Turbopack이 workspace 루트를 lockfile 위치로 추론하는데, 레포 루트의 pnpm-lock.yaml을 잡으면서 frontend 앱 기준 모듈 경로가 어긋남.",
    fix: "next.config.ts에서 turbopack root를 frontend로 명시해 추론을 우회.",
    fixCode: `// next.config.ts
const nextConfig = {
  turbopack: { root: __dirname },
};`,
    verification: "dev·빌드 모두 통과. CI의 pnpm 캐시 키 갱신은 TODO로 남김.",
    commitMessage: "fix: turbopack 버그 수정",
    source: "git diff + Claude Code session",
    visibility: "Private",
  },
};

export function getLogRecipe(logId: string): WorkspaceLogRecipe | undefined {
  const detailed = workspaceLogRecipes[logId];
  if (detailed) return detailed;

  const log = getLogById(logId);
  if (!log) return undefined;

  return {
    problem: log.description,
    source: log.meta.includes("auto-captured") ? "auto-captured" : undefined,
    visibility: "Private",
    commitMessage: log.commit ? `commit ${log.commit}` : undefined,
  };
}

export function getTaskHref(taskId: string) {
  return `/tasks/${taskId}`;
}

export function getTasksHref() {
  return "/tasks";
}

export function getWorkspaceGraphHref() {
  return "/graph";
}

export function getMcpGuideHref() {
  return "/settings/mcp-guide";
}

export function getManageHref() {
  return "/settings/manage";
}

export function getNewWorkspaceHref() {
  return "/workspaces/new";
}

export function getTaskEditHref(taskId: string) {
  return `/tasks/${taskId}/edit`;
}

export function getNewTaskHref() {
  return "/tasks/new";
}

export function getNewLogHref(taskId?: string) {
  return taskId ? `/logs/new?taskId=${taskId}` : "/logs/new";
}

export type TaskListFilter = "active" | "all" | WorkspaceWorkStatus;

export function isActiveTaskStatus(status: WorkspaceWorkStatus) {
  return status === "doing" || status === "todo";
}

export function getTasksFiltered(filter: TaskListFilter) {
  if (filter === "all") {
    return workspaceWorkItems;
  }

  if (filter === "active") {
    return workspaceWorkItems.filter((task) => isActiveTaskStatus(task.status));
  }

  return workspaceWorkItems.filter((task) => task.status === filter);
}

export function countTasksByStatus(status: WorkspaceWorkStatus) {
  return workspaceWorkItems.filter((task) => task.status === status).length;
}

export function countDoingTasks() {
  return countTasksByStatus("doing");
}

export function getTaskExcerpt(body: string, maxLength = 100) {
  // Drop heading lines entirely so "## Context" does not become the excerpt.
  const plain = body
    .replace(/^#+\s+.*$/gm, "")
    .replace(/[*`_~[\]()]/g, "")
    .trim();
  const firstLine =
    plain
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "";

  if (!firstLine) {
    return "";
  }

  if (firstLine.length <= maxLength) {
    return firstLine;
  }

  return `${firstLine.slice(0, maxLength).trim()}…`;
}

export type WorkspaceOutputStatus = "draft" | "exported";

export type WorkspaceTaskOutput = {
  id: string;
  taskId: string;
  taskIds: string[];
  logIds: string[];
  taskCount?: number;
  logCount?: number;
  status: WorkspaceOutputStatus;
  title: string;
  description: string;
  content: string;
  updatedLabel: string;
  /** ISO timestamp used to keep incremental dashboard updates in server order. */
  updatedAt?: string;
  linkedPostId?: string;
  linkedPostStatus?: "draft" | "published" | "unpublished";
  postEditHref?: string;
  publishedHref?: string;
};

export const workspaceTaskOutputs: WorkspaceTaskOutput[] = [
  {
    id: "terraform-gcs-output",
    taskId: "terraform-gcs",
    taskIds: ["terraform-gcs"],
    logIds: ["terraform-state", "gcs-lock-retry"],
    status: "draft",
    title: "Terraform state 정리",
    description: "from 2 logs",
    content: `## Summary

Terraform state를 GCS backend로 옮기면서 로컬 state 충돌 위험을 줄였습니다. 동시에 동시 plan 실행 시 잠금 충돌이 자동 재시도되지 않는 문제를 후속 작업으로 남겼습니다.

## Source logs

- Terraform state를 GCS backend로 이전
- GCS state 잠금 충돌 시 재시도 없음

## Publish notes

public post로 발행하기 전에 CI plan/apply 흐름과 권한 범위를 한 번 더 검증합니다.`,
    updatedLabel: "Jun 30",
  },
];

export function getOutputsForTask(taskId: string) {
  return workspaceTaskOutputs.filter((output) => output.taskIds.includes(taskId));
}

export function getOutputById(outputId: string) {
  return workspaceTaskOutputs.find((output) => output.id === outputId);
}

export function getOutputsHref(status?: WorkspaceOutputStatus) {
  return status ? `/outputs?status=${status}` : "/outputs";
}

export function getOutputHref(outputId: string) {
  return `/outputs/${outputId}`;
}

export function getNewOutputHref(taskId?: string) {
  return taskId ? `/outputs/new?taskId=${taskId}` : "/outputs/new";
}

export function getOutputStatusLabel(status: WorkspaceOutputStatus) {
  return status === "draft" ? "Draft" : "Post created";
}

export function getOutputsFiltered(status: WorkspaceOutputStatus | "all") {
  if (status === "all") {
    return workspaceTaskOutputs;
  }

  return workspaceTaskOutputs.filter((output) => output.status === status);
}

export function countOutputsByStatus(status: WorkspaceOutputStatus) {
  return workspaceTaskOutputs.filter((output) => output.status === status).length;
}

export function getLogsForOutput(output: WorkspaceTaskOutput) {
  return output.logIds
    .map((logId) => getLogById(logId))
    .filter((log): log is WorkspaceLogItem => Boolean(log));
}

export function getTasksForOutput(output: WorkspaceTaskOutput) {
  return output.taskIds
    .map((taskId) => getTaskById(taskId))
    .filter((task): task is WorkspaceWorkItem => Boolean(task));
}

export type WorkspaceTaskMeta = {
  startedLabel: string;
  lastActivityLabel: string;
};

export const workspaceTaskMeta: Record<string, WorkspaceTaskMeta> = {
  "workspace-view": {
    startedLabel: "Jun 28",
    lastActivityLabel: "Today 11:05",
  },
  "pnpm-migration": {
    startedLabel: "Jun 25",
    lastActivityLabel: "Today 14:20",
  },
  "terraform-gcs": {
    startedLabel: "Jun 27",
    lastActivityLabel: "Jun 30",
  },
  "post-visibility": {
    startedLabel: "Jul 2",
    lastActivityLabel: "Jul 2",
  },
};

export function getTaskMeta(taskId: string): WorkspaceTaskMeta {
  return (
    workspaceTaskMeta[taskId] ?? {
      startedLabel: "—",
      lastActivityLabel: "—",
    }
  );
}

/**
 * Started = task creation.
 * Updated = latest of task.updatedAt and linked log updatedAt/createdAt (log add / task edit).
 * Demo tasks without timestamps fall back to hardcoded meta / log meta labels.
 */
export function resolveTaskActivityMeta(
  task: WorkspaceWorkItem,
  logs: WorkspaceLogItem[] = [],
): WorkspaceTaskMeta {
  if (!task.createdAt && !task.updatedAt) {
    const demo = getTaskMeta(task.id);
    const latestLogLabel = logs[0]?.meta.split(" · ")[0];
    if (!latestLogLabel) return demo;
    return {
      startedLabel: demo.startedLabel,
      lastActivityLabel: latestLogLabel,
    };
  }

  const startedLabel = task.createdAt
    ? formatWorkspaceDateLabel(task.createdAt)
    : "—";
  const latestActivity = pickLatestIso([
    task.updatedAt,
    ...logs.flatMap((log) => [log.updatedAt, log.createdAt]),
  ]);

  return {
    startedLabel,
    lastActivityLabel: latestActivity
      ? formatWorkspaceDateLabel(latestActivity)
      : startedLabel,
  };
}

export function getTaskBranches(taskId: string) {
  const counts = new Map<string, number>();

  for (const log of workspaceLogs) {
    if (log.taskId !== taskId || !log.branch) continue;
    counts.set(log.branch, (counts.get(log.branch) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([branch, count]) => ({ branch, count }))
    .sort((a, b) => b.count - a.count);
}

export function countUnassignedLogs() {
  return workspaceLogs.filter((log) => !log.taskId).length;
}

export type WorkspaceSpawnedTodo = {
  taskId: string;
  todoId: string;
  dueLabel?: string;
};

export const workspaceSpawnedTodos: WorkspaceSpawnedTodo[] = [
  {
    taskId: "workspace-view",
    todoId: "guest-prompt",
    dueLabel: "due today",
  },
];

export function getSpawnedTodosForTask(taskId: string) {
  return workspaceSpawnedTodos
    .map((link) => ({
      link,
      todo: workspaceTodos.find((item) => item.id === link.todoId),
    }))
    .filter(
      (entry): entry is { link: WorkspaceSpawnedTodo; todo: WorkspaceTodoItem } =>
        entry.link.taskId === taskId && entry.todo !== undefined,
    );
}

export type WorkspaceTodoItem = {
  id: string;
  title: string;
  description?: string;
  done?: boolean;
  taskId?: string;
  plannedFor?: string;
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
  { key: "all", label: "All" },
  { key: "issues", label: "Issues" },
  { key: "fixes", label: "Fixes" },
  { key: "decisions", label: "Decisions" },
  { key: "notes", label: "Notes" },
] as const;

export type LogListTypeFilter = (typeof logsSubnavItems)[number]["key"];

export type LogTaskFilter = "all" | "unassigned" | string;

export function getLogListTitle(type: LogListTypeFilter) {
  switch (type) {
    case "issues":
      return "Issues";
    case "fixes":
      return "Fixes";
    case "decisions":
      return "Decisions";
    case "notes":
      return "Notes";
    default:
      return "Logs";
  }
}

export function getLogsHref(type: LogListTypeFilter = "all") {
  if (type === "all") {
    return "/logs";
  }

  return `/logs/${type}`;
}

export function getMemoryHref(memoryId?: string) {
  return memoryId ? `/memory/${memoryId}` : "/memory";
}

export function getActivityHref(date?: string) {
  return date ? `/activity?date=${encodeURIComponent(date)}` : "/activity";
}

export function getPlannerHref(month?: string, date?: string) {
  const params = new URLSearchParams();
  if (month) params.set("month", month);
  if (date) params.set("date", date);
  const query = params.toString();
  return query ? `/planner?${query}` : "/planner";
}

export function buildLogsListHref(
  type: LogListTypeFilter,
  taskFilter: LogTaskFilter = "all",
) {
  const base = getLogsHref(type);
  if (taskFilter === "all") {
    return base;
  }

  return `${base}?task=${encodeURIComponent(taskFilter)}`;
}

function matchesLogTypeFilter(
  log: WorkspaceLogItem,
  type: LogListTypeFilter,
) {
  switch (type) {
    case "issues":
      return log.label.toLowerCase() === "issue";
    case "fixes":
      return log.label.toLowerCase() === "fix";
    case "decisions":
      return log.label.toLowerCase() === "decision";
    case "notes":
      return log.label.toLowerCase() === "note" || log.kind === "NOTE";
    default:
      return true;
  }
}

export function getLogsFiltered(
  type: LogListTypeFilter,
  taskFilter: LogTaskFilter = "all",
) {
  return workspaceLogs.filter((log) => {
    if (!matchesLogTypeFilter(log, type)) {
      return false;
    }

    if (taskFilter === "unassigned") {
      return !log.taskId;
    }

    if (taskFilter !== "all" && log.taskId !== taskFilter) {
      return false;
    }

    return true;
  });
}

export function countLogsByType(type: LogListTypeFilter) {
  return getLogsFiltered(type).length;
}

export function countOpenIssues() {
  return countLogsByType("issues");
}

export function getTaskFiltersForLogs(type: LogListTypeFilter) {
  const taskIds = new Set<string>();

  for (const log of getLogsFiltered(type)) {
    if (log.taskId) {
      taskIds.add(log.taskId);
    }
  }

  return workspaceWorkItems.filter((task) => taskIds.has(task.id));
}

export function countUnassignedLogsForType(type: LogListTypeFilter) {
  return getLogsFiltered(type, "unassigned").length;
}

export const workspaceOutputs = [
  {
    title: "Refined draft",
    description: "from 3 logs",
    kind: "draft",
  },
  {
    title: "Ready to publish",
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
    authorIsOpenLogOfficial: false,
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
    authorIsOpenLogOfficial: false,
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
    authorIsOpenLogOfficial: false,
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
    authorIsOpenLogOfficial: false,
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
