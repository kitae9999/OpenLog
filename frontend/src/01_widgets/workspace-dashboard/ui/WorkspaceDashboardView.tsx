"use client";

import Link from "next/link";
import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/cn";
import { todayIso } from "@/shared/lib/todayIso";
import { GitHubIcon } from "@/shared/ui/icons";
import { ActivityYearGrid } from "@/widgets/activity-calendar/ui/ActivityYearGrid";
import {
  getLogHref,
  getLogsHref,
  getMcpGuideHref,
  getMemoryHref,
  getNewTaskHref,
  getTaskExcerpt,
  getTaskHref,
  getTasksHref,
  isActiveTaskStatus,
  resolveTaskActivityMeta,
  type WorkspaceLogItem,
  type WorkspaceTaskOutput,
  type WorkspaceTodoItem,
  type WorkspaceWorkItem,
  type WorkspaceWorkStatus,
} from "@/entities/workspace/model/data";
import {
  getPreviewReplayWorkspaceData,
  isPreviewHighlight,
  PREVIEW_RESERVED_COUNTS,
  type PreviewReplayHighlight,
  type PreviewReplaySnapshot,
} from "@/widgets/workspace-preview/model/previewSessionReplay";
import {
  IDLE_SYNC_FILL,
  isIncomingId,
  isZoneFetching,
  type SyncFillState,
} from "@/shared/model/syncFill";
import { FetchingIndicator } from "@/shared/ui/sync/FetchingIndicator";
import { useWorkspaceLiveSync } from "@/features/workspace-sync/model/useWorkspaceLiveSync";
import { WorkspaceGraphPreview } from "@/widgets/workspace-dashboard/ui/WorkspaceGraphPreview";
import {
  createWorkspaceTodo,
  deleteWorkspaceTodo,
  refreshWorkspaceDashboard,
  updateWorkspaceTodoDone,
  type WorkspaceActionResult,
} from "@/features/workspace-actions/api/workspaceActions";
import type {
  WorkspaceActivity,
  WorkspaceUiData,
  WorkspaceWorkingBrief,
} from "@/entities/workspace/model/workspaceTypes";

const PreviewReplayHighlightContext = createContext<PreviewReplayHighlight>({
  kind: "none",
});

const PreviewSyncFillContext = createContext<SyncFillState>(IDLE_SYNC_FILL);

function usePreviewReplayHighlight() {
  return useContext(PreviewReplayHighlightContext);
}

function usePreviewSyncFill() {
  return useContext(PreviewSyncFillContext);
}

type ExploreWidget = "activity" | "graph" | "memory" | "tasks";

/** Empty block body — reserves height with copy + CTA, no mock rows. */
/** Height for 4 rows (py-2 + leading-6) + 3×1px divide borders — no phantom scrollbar at 4. */
const SIDE_LIST_VIEWPORT_BASE =
  "openlog-scroll mt-3 h-[calc(2.5rem*4+3px)]";

/**
 * Fixed-height list frame. Only enables overflow-y scrolling when content
 * actually overflows — otherwise trackpad wheel passes through to the page.
 */
function SideListViewport({
  as: Component = "div",
  className,
  children,
}: {
  as?: "div" | "ul";
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | HTMLUListElement | null>(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      setCanScroll(el.scrollHeight > el.clientHeight + 1);
    };

    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <Component
      ref={ref as never}
      className={cn(
        SIDE_LIST_VIEWPORT_BASE,
        canScroll ? "overflow-y-auto" : "overflow-y-hidden",
        className,
      )}
    >
      {children}
    </Component>
  );
}

const EXPLORE_TABS: { id: ExploreWidget; label: string }[] = [
  { id: "activity", label: "Activity" },
  { id: "graph", label: "Graph" },
  { id: "memory", label: "Memory" },
  { id: "tasks", label: "Tasks" },
];

const AGENT_GUIDE_TIP_STORAGE_KEY = "openlog.dismiss-agent-guide-tip";
const MCP_SETUP_PROMPT_STORAGE_KEY = "openlog.dismiss-mcp-setup-prompt";

function AgentGuideTipLink({
  workspaceId,
  blocked,
}: {
  workspaceId: string;
  blocked: boolean;
}) {
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (blocked) {
        setShowTip(false);
        return;
      }
      try {
        if (window.localStorage.getItem(AGENT_GUIDE_TIP_STORAGE_KEY) !== "1") {
          setShowTip(true);
        }
      } catch {
        setShowTip(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [blocked]);

  const dismissTip = () => {
    try {
      window.localStorage.setItem(AGENT_GUIDE_TIP_STORAGE_KEY, "1");
    } catch {
      // Ignore quota / private-mode failures; tip still closes for this session.
    }
    setShowTip(false);
  };

  return (
    <div className="relative">
      <Link
        href={`/settings/workspaces/${workspaceId}/agent`}
        className="text-[12.5px] font-semibold text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        Agent Guide →
      </Link>
      {showTip ? (
        <div
          role="note"
          className="absolute top-full right-0 z-20 mt-2.5 w-max max-w-[min(280px,calc(100vw-2rem))] rounded-lg border border-zinc-200 bg-white px-3 py-2.5 shadow-[0_10px_28px_-18px_rgba(24,24,27,0.55)]"
        >
          <span
            aria-hidden="true"
            className="absolute -top-[5px] right-5 size-2.5 rotate-45 border-t border-l border-zinc-200 bg-white"
          />
          <p className="relative text-[12px] leading-4 text-zinc-600">
            이 워크스페이스에서 에이전트가 무엇을 남길지 알려 주세요.
          </p>
          <button
            type="button"
            onClick={dismissTip}
            className="relative mt-1.5 text-[11px] font-medium text-zinc-400 underline-offset-2 transition hover:text-zinc-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            다시 보지 않기
          </button>
        </div>
      ) : null}
    </div>
  );
}

function McpSetupPrompt({
  enabled,
  hasWorkspaceActivity,
  onOpenChange,
}: {
  enabled: boolean;
  hasWorkspaceActivity: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!enabled || hasWorkspaceActivity) {
        setOpen(false);
        onOpenChange(false);
        return;
      }
      let shouldOpen = false;
      try {
        shouldOpen =
          window.localStorage.getItem(MCP_SETUP_PROMPT_STORAGE_KEY) !== "1";
      } catch {
        shouldOpen = true;
      }
      setOpen(shouldOpen);
      onOpenChange(shouldOpen);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [enabled, hasWorkspaceActivity, onOpenChange]);

  const dismiss = () => {
    try {
      window.localStorage.setItem(MCP_SETUP_PROMPT_STORAGE_KEY, "1");
    } catch {
      // Ignore quota / private-mode failures; prompt still closes for this session.
    }
    setOpen(false);
    onOpenChange(false);
  };

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <button
        type="button"
        aria-label="MCP 안내 닫기"
        onClick={dismiss}
        className="absolute inset-0 bg-zinc-950/12 backdrop-blur-[10px] backdrop-saturate-150"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-[380px] rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_18px_50px_rgba(24,24,27,0.12)]"
      >
        <h2
          id={titleId}
          className="text-[16px] font-semibold tracking-[-0.01em] text-zinc-950"
        >
          에이전트랑 연결할까요?
        </h2>
        <p
          id={descriptionId}
          className="mt-2 text-[13.5px] leading-6 text-zinc-500"
        >
          한 줄 명령으로 setup과 init까지 끝나요. MCP Guide에서 Cursor, Claude,
          Codex 연결 방법을 볼 수 있어요.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-9 items-center rounded-xl px-3.5 text-[13px] font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            나중에
          </button>
          <Link
            href={getMcpGuideHref()}
            onClick={dismiss}
            className="inline-flex h-9 items-center rounded-xl bg-zinc-950 px-3.5 text-[13px] font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            MCP Guide 열기
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function WorkspaceDashboardView({
  workspaceData,
  activity,
  createTodoOverride,
  replaySnapshot,
}: {
  workspaceData: WorkspaceUiData | null;
  activity?: WorkspaceActivity | null;
  createTodoOverride?: (title: string) => Promise<WorkspaceActionResult>;
  replaySnapshot?: PreviewReplaySnapshot;
}) {
  const isPreview = Boolean(replaySnapshot);
  const [liveWorkspaceData, setLiveWorkspaceData] = useState(workspaceData);

  useEffect(() => {
    setLiveWorkspaceData(workspaceData);
  }, [workspaceData]);

  const resolvedWorkspaceData =
    isPreview && replaySnapshot
      ? getPreviewReplayWorkspaceData(replaySnapshot)
      : liveWorkspaceData;
  const workspaceId = resolvedWorkspaceData?.workspaceId;
  const refreshDashboard = useCallback(async () => {
    if (!workspaceId) {
      return;
    }
    const result = await refreshWorkspaceDashboard(workspaceId);
    setLiveWorkspaceData((current) =>
      result.ok && current
        ? { ...current, ...result.data }
        : current
          ? { ...current }
          : current,
    );
  }, [workspaceId]);
  const highlight = replaySnapshot?.highlight ?? { kind: "none" as const };
  const liveSync = useWorkspaceLiveSync({
    workspaceId: resolvedWorkspaceData?.workspaceId
      ? Number(resolvedWorkspaceData.workspaceId)
      : null,
    enabled: !isPreview && Boolean(resolvedWorkspaceData?.workspaceId),
    onRefresh: refreshDashboard,
  });
  const {
    syncFill: liveSyncFill,
    noteEntityIds,
    showFetchingToast,
    fetchingToastExiting,
  } = liveSync;
  const syncFill = isPreview
    ? (replaySnapshot?.syncFill ?? {
        status: "idle" as const,
        reserved: { ...PREVIEW_RESERVED_COUNTS },
        incomingIds: [] as string[],
      })
    : liveSyncFill;

  const [exploreWidget, setExploreWidget] = useState<ExploreWidget>(() => {
    if (
      replaySnapshot?.highlight.kind === "graph" ||
      replaySnapshot?.cursorTarget === "graph"
    ) {
      return "graph";
    }
    return "activity";
  });
  const [mcpPromptOpen, setMcpPromptOpen] = useState(false);
  const tasks = resolvedWorkspaceData?.tasks ?? [];
  const logs = resolvedWorkspaceData?.logs ?? [];
  const memories = resolvedWorkspaceData?.memories ?? [];
  const outputs = resolvedWorkspaceData?.outputs ?? [];
  const resolvedActivity = resolvedWorkspaceData?.activity ?? activity;
  // Backend timestamps are timezone-free Asia/Seoul local datetimes.
  const brief =
    resolvedWorkspaceData?.workingBrief ?? deriveWorkingBrief(tasks, logs);
  const recentLogs = logs.slice(0, 6);
  const visibleTasks = tasks.filter((task) => isActiveTaskStatus(task.status));
  const tasksFetching = isZoneFetching(syncFill, "tasks");
  const logsFetching = isZoneFetching(syncFill, "logs");
  const briefFetching = isZoneFetching(syncFill, "brief");
  const showOutputSection =
    isPreview &&
    (outputs.length > 0 ||
      (syncFill.status === "fetching" && syncFill.zone === "output"));
  const briefIncoming =
    isIncomingId(syncFill, "working-brief") ||
    (brief?.taskId != null && isIncomingId(syncFill, brief.taskId)) ||
    (syncFill.zone === "brief" &&
      (syncFill.status === "filling" || syncFill.status === "settled") &&
      syncFill.incomingIds.length > 0);
  const briefHighlighted =
    isPreview &&
    brief?.taskId != null &&
    isPreviewHighlight(highlight, "task", brief.taskId);

  useEffect(() => {
    if (isPreview || !resolvedWorkspaceData) {
      return;
    }
    noteEntityIds([
      ...resolvedWorkspaceData.tasks.map((task) => task.id),
      ...resolvedWorkspaceData.logs.map((log) => log.id),
      ...resolvedWorkspaceData.todos.map((todo) => todo.id),
      ...resolvedWorkspaceData.outputs.map((output) => output.id),
      ...resolvedWorkspaceData.memories.map((memory) => memory.id),
      ...(resolvedWorkspaceData.workingBrief || brief
        ? ["working-brief"]
        : []),
    ]);
  }, [brief, isPreview, noteEntityIds, resolvedWorkspaceData]);

  useEffect(() => {
    if (!isPreview || !replaySnapshot) {
      return;
    }
    if (
      replaySnapshot.highlight.kind === "graph" ||
      replaySnapshot.cursorTarget === "graph"
    ) {
      const frame = window.requestAnimationFrame(() => {
        setExploreWidget("graph");
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [isPreview, replaySnapshot]);

  const dashboard = (
    <div className="mx-auto w-full max-w-[920px]">
      <header className="flex flex-wrap items-end justify-between gap-3 pb-8">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
            {resolvedWorkspaceData?.workspaceName ?? "Workspace"}
          </h1>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-8 gap-y-2">
          {resolvedWorkspaceData?.repositoryFullName ? (
            <a
              href={`https://github.com/${resolvedWorkspaceData.repositoryFullName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex max-w-full items-center gap-2 rounded-md py-1 text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              title={`Open ${resolvedWorkspaceData.repositoryFullName} on GitHub`}
            >
              <GitHubIcon className="size-4 shrink-0 text-zinc-700 transition group-hover:text-zinc-950" />
              <span className="truncate font-mono text-[12.5px] underline-offset-2 group-hover:underline">
                {resolvedWorkspaceData.repositoryFullName}
              </span>
            </a>
          ) : resolvedWorkspaceData && resolvedWorkspaceData.projects.length > 1 ? (
            <Link
              href={`/settings/workspaces/${resolvedWorkspaceData.workspaceId}/agent`}
              className="text-[12.5px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              {resolvedWorkspaceData.projects.length} projects
            </Link>
          ) : null}
          {!isPreview &&
          resolvedWorkspaceData &&
          (resolvedWorkspaceData.repositoryFullName ||
            resolvedWorkspaceData.projects.length > 1) ? (
            <span aria-hidden="true" className="text-[12.5px] text-zinc-300">
              |
            </span>
          ) : null}
          {!isPreview && resolvedWorkspaceData ? (
            <AgentGuideTipLink
              workspaceId={resolvedWorkspaceData.workspaceId}
              blocked={mcpPromptOpen}
            />
          ) : null}
        </div>
      </header>

      {!isPreview ? (
        <McpSetupPrompt
          enabled
          hasWorkspaceActivity={tasks.length > 0 || logs.length > 0}
          onOpenChange={setMcpPromptOpen}
        />
      ) : null}

      <section
        data-preview-anchor={isPreview ? "task" : undefined}
        className={cn(
          "border-l-2 border-zinc-950 pl-5",
          (tasksFetching || briefFetching) && !brief && "sync-zone-fetching",
        )}
      >
        <SectionLabel>Now working</SectionLabel>
        {brief ? (
          <div
            className={cn(
              "mt-3",
              briefIncoming && "sync-item-enter",
              briefHighlighted && "preview-replay-highlight",
            )}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {brief.taskId ? (
                <PreviewableLink
                  href={getTaskHref(brief.taskId)}
                  isPreview={isPreview}
                  className="text-[20px] font-semibold tracking-tight text-zinc-950 transition hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                  previewClassName="cursor-default text-[20px] font-semibold tracking-tight text-zinc-950"
                >
                  {brief.title}
                </PreviewableLink>
              ) : (
                <h2 className="text-[20px] font-semibold tracking-tight text-zinc-950">
                  {brief.title}
                </h2>
              )}
              {brief.branch ? (
                <span className="font-mono text-[12.5px] text-zinc-500">
                  {brief.branch}
                </span>
              ) : null}
              {briefIncoming ? <NewUpdateBadge /> : null}
            </div>
            <p className="mt-3 max-w-[62ch] text-[15px] leading-7 text-zinc-600">
              {brief.prose}
            </p>
            <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-zinc-500">
              {brief.taskTitle && brief.taskId ? (
                <PreviewableLink
                  href={getTaskHref(brief.taskId)}
                  isPreview={isPreview}
                  className="font-medium transition hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                  previewClassName="cursor-default font-medium text-zinc-500"
                >
                  {brief.taskTitle}
                </PreviewableLink>
              ) : null}
              {brief.taskTitle && brief.updatedLabel ? (
                <span className="text-zinc-300">·</span>
              ) : null}
              {brief.updatedLabel ? (
                <span>Updated {brief.updatedLabel}</span>
              ) : (
                <span>Updated from session</span>
              )}
            </div>
          </div>
        ) : (
          // When an agent works with OpenLog, it pushes a short brief here —
          // branch, task, and how far things got.
          <p className="mt-3 max-w-[52ch] text-[14.5px] leading-6 text-zinc-500">
            에이전트로 작업하면, 작업 단위마다 에이전트가 여기 brief를 자동으로
            업데이트해요.
          </p>
        )}
      </section>

      <SectionRule />

      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-0">
        <section className="lg:pr-10">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
              <SectionLabel>Tasks</SectionLabel>
              <TaskStatusLegend />
            </div>
            <QuietLink href={getTasksHref()} isPreview={isPreview}>
              View all
            </QuietLink>
          </div>
          {visibleTasks.length === 0 ? (
            <SideListViewport
              className={cn(
                "flex items-start",
                tasksFetching && "sync-zone-fetching",
              )}
            >
              <p className="text-sm text-zinc-500">No tasks yet.</p>
            </SideListViewport>
          ) : (
            <SideListViewport
              as="ul"
              className="divide-y divide-zinc-200/80"
            >
              {visibleTasks.map((task) => (
                <TaskRow key={task.id} task={task} isPreview={isPreview} />
              ))}
            </SideListViewport>
          )}
          <PreviewableLink
            href={getNewTaskHref()}
            isPreview={isPreview}
            className="mt-2.5 inline-flex text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            previewClassName="mt-2.5 inline-flex cursor-default text-[13px] font-medium text-zinc-300"
          >
            + New task
          </PreviewableLink>
        </section>

        <section
          data-testid="todos-section"
          data-preview-anchor={isPreview ? "todos" : undefined}
          className="relative lg:border-l lg:border-zinc-200 lg:pl-10"
        >
          {/* 세로 스택( < lg )일 때 Tasks↔Todos 구분선. gap-10 중앙에 맞춤. */}
          <div
            className="absolute inset-x-0 -top-5 h-px bg-zinc-200 lg:hidden"
            aria-hidden="true"
          />
          <TodosSection
            todos={resolvedWorkspaceData?.todos ?? []}
            workspaceId={resolvedWorkspaceData?.workspaceId}
            createTodoOverride={createTodoOverride}
            isPreview={isPreview}
          />
        </section>
      </div>

      <SectionRule />

      <section
        data-preview-anchor={isPreview ? "logs" : undefined}
        className={cn(
          logsFetching && recentLogs.length === 0 && "sync-zone-fetching",
        )}
      >
        <div className="flex items-baseline justify-between gap-3">
          <SectionLabel>Recent logs</SectionLabel>
          <QuietLink href={getLogsHref()} isPreview={isPreview}>
            View all
          </QuietLink>
        </div>
        {recentLogs.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No logs yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200/80">
            {recentLogs.map((log) => (
              <LogRow key={log.id} log={log} isPreview={isPreview} />
            ))}
          </ul>
        )}
      </section>

      {showOutputSection ? (
        <>
          <SectionRule />
          <PreviewOutputSection
            outputs={outputs}
            syncFill={syncFill}
            highlight={highlight}
          />
        </>
      ) : null}

      <SectionRule />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionLabel>Views</SectionLabel>
          <div
            role="tablist"
            aria-label="Workspace views"
            className="flex items-center gap-1"
          >
            {EXPLORE_TABS.map((tab) => {
              const active = exploreWidget === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setExploreWidget(tab.id)}
                  className={cn(
                    "relative h-8 px-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                    active
                      ? "text-zinc-950"
                      : "text-zinc-500 hover:text-zinc-800",
                  )}
                >
                  {tab.label}
                  {active ? (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 bg-zinc-950" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div
          role="tabpanel"
          data-preview-anchor={
            isPreview && exploreWidget === "graph" ? "graph" : undefined
          }
          className="mt-5 min-h-[200px]"
        >
          {exploreWidget === "activity" ? (
            resolvedActivity ? (
              <ActivityYearGrid activity={resolvedActivity} />
            ) : (
              <p className="text-sm text-zinc-500">
                {isPreview
                  ? "Activity fills in as you work."
                  : "Activity could not be loaded."}
              </p>
            )
          ) : null}
          {exploreWidget === "graph" ? (
            <GraphPanel
              workspaceData={resolvedWorkspaceData}
              isPreview={isPreview}
              highlight={highlight}
            />
          ) : null}
          {exploreWidget === "memory" ? (
            <MemoryWidget memories={memories} isPreview={isPreview} />
          ) : null}
          {exploreWidget === "tasks" ? (
            <TasksWidget tasks={visibleTasks} isPreview={isPreview} />
          ) : null}
        </div>
      </section>
    </div>
  );

  if (!isPreview) {
    return (
      <PreviewSyncFillContext.Provider value={syncFill}>
        {dashboard}
        {showFetchingToast ? (
          <FetchingIndicator
            exiting={fetchingToastExiting}
            className="fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6"
          />
        ) : null}
      </PreviewSyncFillContext.Provider>
    );
  }

  return (
    <PreviewReplayHighlightContext.Provider value={highlight}>
      <PreviewSyncFillContext.Provider value={syncFill}>
        {dashboard}
      </PreviewSyncFillContext.Provider>
    </PreviewReplayHighlightContext.Provider>
  );
}

function TaskRow({
  task,
  isPreview = false,
}: {
  task: WorkspaceWorkItem;
  isPreview?: boolean;
}) {
  const highlight = usePreviewReplayHighlight();
  const syncFill = usePreviewSyncFill();
  const isHighlighted =
    isPreview && isPreviewHighlight(highlight, "task", task.id);
  const isIncoming = isIncomingId(syncFill, task.id);

  return (
    <li>
      <PreviewableLink
        href={getTaskHref(task.id)}
        isPreview={isPreview}
        className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        previewClassName="group flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2"
        title={task.status}
      >
        <span
          className={cn(
            isIncoming && "sync-item-enter",
            isHighlighted && "preview-replay-highlight",
            "flex min-w-0 flex-1 items-center gap-2.5",
          )}
        >
          <StatusDot status={task.status} />
          <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium text-zinc-950">
            {task.title}
          </span>
          {isIncoming ? <NewUpdateBadge /> : null}
          <span className="sr-only">{task.status}</span>
        </span>
      </PreviewableLink>
    </li>
  );
}

function LogRow({
  log,
  isPreview = false,
}: {
  log: WorkspaceLogItem;
  isPreview?: boolean;
}) {
  const highlight = usePreviewReplayHighlight();
  const syncFill = usePreviewSyncFill();
  const isHighlighted =
    isPreview && isPreviewHighlight(highlight, "log", log.id);
  const isIncoming = isIncomingId(syncFill, log.id);

  return (
    <li>
      <PreviewableLink
        href={getLogHref(log.id)}
        isPreview={isPreview}
        className="block rounded-lg px-2.5 py-2.5 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        previewClassName="block cursor-default rounded-lg px-2.5 py-2.5"
      >
        <div
          className={cn(
            isIncoming && "sync-item-enter",
            isHighlighted && "preview-replay-highlight",
          )}
        >
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[12.5px] font-medium text-zinc-500">
              {log.label}
            </span>
            <span className="min-w-0 truncate text-[14.5px] font-medium text-zinc-950">
              {log.title}
            </span>
            {isIncoming ? <NewUpdateBadge /> : null}
          </div>
          <p className="mt-1 truncate text-[12.5px] text-zinc-500">
            {log.meta}
          </p>
        </div>
      </PreviewableLink>
    </li>
  );
}

function GraphPanel({
  workspaceData,
  isPreview = false,
  highlight,
}: {
  workspaceData: WorkspaceUiData | null;
  isPreview?: boolean;
  highlight: PreviewReplayHighlight;
}) {
  const isHighlighted = isPreview && isPreviewHighlight(highlight, "graph");

  return (
    <div className={cn(isHighlighted && "preview-replay-highlight")}>
      <WorkspaceGraphPreview
        workspaceData={workspaceData}
        heightClassName="h-[240px]"
      />
    </div>
  );
}

function PreviewOutputSection({
  outputs,
  syncFill,
  highlight,
}: {
  outputs: WorkspaceTaskOutput[];
  syncFill: SyncFillState;
  highlight: PreviewReplayHighlight;
}) {
  const output = outputs[0];
  const outputFetching = isZoneFetching(syncFill, "output");
  const isIncoming =
    output != null && isIncomingId(syncFill, output.id);
  const isHighlighted =
    output != null && isPreviewHighlight(highlight, "output", output.id);

  return (
    <section
      data-preview-anchor="output"
      className={cn(outputFetching && !output && "sync-zone-fetching")}
    >
      <SectionLabel>Output</SectionLabel>
      {output ? (
        <article
          className={cn(
            "mt-3 max-w-[62ch]",
            isIncoming && "sync-item-enter",
            isHighlighted && "preview-replay-highlight",
          )}
        >
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-zinc-500">
            <span className="font-medium uppercase tracking-wide text-zinc-400">
              Draft
            </span>
            {isIncoming ? <NewUpdateBadge /> : null}
            {output.description ? <span>{output.description}</span> : null}
          </div>
          <h3 className="mt-2 text-[17px] font-semibold tracking-tight text-zinc-950">
            {output.title}
          </h3>
          <p className="mt-2 text-[14.5px] leading-7 text-zinc-600">
            {output.content.trim()
              ? output.content.replace(/^## Summary\n\n/, "")
              : "Linked logs are ready to publish."}
          </p>
          {output.updatedLabel ? (
            <p className="mt-2 text-[12.5px] text-zinc-500">
              Updated {output.updatedLabel}
            </p>
          ) : null}
        </article>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">
          Linked logs can become a publish-ready draft when you&apos;re ready.
        </p>
      )}
    </section>
  );
}

function MemoryWidget({
  memories,
  isPreview = false,
}: {
  memories: NonNullable<WorkspaceUiData["memories"]>;
  isPreview?: boolean;
}) {
  const highlight = usePreviewReplayHighlight();
  const syncFill = usePreviewSyncFill();
  const isHighlighted = isPreview && isPreviewHighlight(highlight, "memory");
  const memoryIncoming =
    isIncomingId(syncFill, "memory") ||
    memories.some((memory) => isIncomingId(syncFill, memory.id));
  const memoryFetching =
    syncFill.status === "fetching" &&
    (syncFill.zone === "memory" ||
      (syncFill.zone === "output" && memories.length === 0));

  if (memories.length === 0) {
    return (
      <p
        className={cn(
          "text-sm text-zinc-500",
          memoryFetching && "sync-zone-fetching",
        )}
      >
        No memories yet.
      </p>
    );
  }

  return (
    <ul
      className={cn(
        "divide-y divide-zinc-200/80",
        memoryIncoming && "sync-item-enter",
        isHighlighted && "preview-replay-highlight",
        memoryFetching && "sync-zone-fetching",
      )}
    >
      {memories.slice(0, 8).map((memory) => (
        <li key={memory.id}>
          <PreviewableLink
            href={getMemoryHref(memory.id)}
            isPreview={isPreview}
            className="block rounded-lg px-2.5 py-2.5 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            previewClassName="block cursor-default rounded-lg px-2.5 py-2.5"
          >
            <span className="text-[14.5px] font-medium text-zinc-950">
              {memory.title}
            </span>
            {memory.excerpt ? (
              <span className="mt-1 block truncate text-[12.5px] text-zinc-500">
                {memory.excerpt}
              </span>
            ) : null}
            {memoryIncoming ? <NewUpdateBadge /> : null}
          </PreviewableLink>
        </li>
      ))}
    </ul>
  );
}

function TasksWidget({
  tasks,
  isPreview = false,
}: {
  tasks: WorkspaceWorkItem[];
  isPreview?: boolean;
}) {
  if (tasks.length === 0) {
    return <p className="text-sm text-zinc-500">No tasks yet.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-200/80">
      {tasks.map((task) => (
        <li key={task.id}>
          <PreviewableLink
            href={getTaskHref(task.id)}
            isPreview={isPreview}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            previewClassName="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2"
            title={task.status}
          >
            <StatusDot status={task.status} />
            <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium text-zinc-950">
              {task.title}
            </span>
            <span className="shrink-0 text-[12px] font-medium text-zinc-500">
              {task.status}
            </span>
          </PreviewableLink>
        </li>
      ))}
    </ul>
  );
}

function TodosSection({
  todos,
  workspaceId,
  createTodoOverride,
  isPreview = false,
}: {
  todos: WorkspaceTodoItem[];
  workspaceId?: string;
  createTodoOverride?: (title: string) => Promise<WorkspaceActionResult>;
  isPreview?: boolean;
}) {
  const syncFill = usePreviewSyncFill();
  const [localTodos, setLocalTodos] = useState(todos);
  const [error, setError] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const openTodos = localTodos.filter((todo) => !todo.done);
  const canMutate =
    !isPreview && (Boolean(workspaceId) || Boolean(createTodoOverride));
  const todosFetching =
    syncFill.status === "fetching" &&
    (syncFill.zone === "todos" ||
      syncFill.incomingIds.some((id) => id.includes("todo")));

  useEffect(() => {
    setLocalTodos(todos);
  }, [todos]);

  function submitTodo() {
    const trimmed = draftTitle.trim();
    if (!trimmed || isPending) {
      return;
    }

    if (createTodoOverride) {
      const optimisticId = `pending-${Date.now()}`;
      const optimisticTodo: WorkspaceTodoItem = {
        id: optimisticId,
        title: trimmed,
        done: false,
        plannedFor: todayIso(),
      };
      setLocalTodos((current) => [...current, optimisticTodo]);
      setDraftTitle("");
      setError(null);

      startTransition(async () => {
        const result = await createTodoOverride(trimmed);
        if (!result.ok) {
          setLocalTodos((current) =>
            current.filter((todo) => todo.id !== optimisticId),
          );
          setError(result.message ?? "Failed to add todo.");
          setDraftTitle(trimmed);
          return;
        }
        if (result.id) {
          setLocalTodos((current) =>
            current.map((todo) =>
              todo.id === optimisticId ? { ...todo, id: result.id! } : todo,
            ),
          );
        }
      });
      return;
    }

    if (!workspaceId) {
      return;
    }

    const optimisticId = `pending-${Date.now()}`;
    const optimisticTodo: WorkspaceTodoItem = {
      id: optimisticId,
      title: trimmed,
      done: false,
      plannedFor: todayIso(),
    };

    setLocalTodos((current) => [...current, optimisticTodo]);
    setDraftTitle("");
    setError(null);

    startTransition(async () => {
      const result = await createWorkspaceTodo({
        workspaceId,
        title: trimmed,
        plannedFor: todayIso(),
      });

      if (!result.ok) {
        setLocalTodos((current) =>
          current.filter((todo) => todo.id !== optimisticId),
        );
        setError(result.message ?? "Failed to add todo.");
        setDraftTitle(trimmed);
        return;
      }
      if (result.id) {
        setLocalTodos((current) =>
          current.map((todo) =>
            todo.id === optimisticId ? { ...todo, id: result.id! } : todo,
          ),
        );
      }
    });
  }

  function toggleTodo(todoId: string) {
    if (isPreview || isPending || todoId.startsWith("pending-")) {
      return;
    }

    const target = localTodos.find((todo) => todo.id === todoId);
    if (!target) {
      return;
    }

    const nextDone = !target.done;

    setLocalTodos((current) =>
      current.map((todo) =>
        todo.id === todoId ? { ...todo, done: nextDone } : todo,
      ),
    );
    setError(null);

    if (createTodoOverride || !workspaceId) {
      return;
    }

    startTransition(async () => {
      const result = await updateWorkspaceTodoDone({
        workspaceId,
        todoId,
        done: nextDone,
      });

      if (!result.ok) {
        setLocalTodos((current) =>
          current.map((todo) =>
            todo.id === todoId ? { ...todo, done: !nextDone } : todo,
          ),
        );
        setError(result.message ?? "Failed to update todo.");
        return;
      }

    });
  }

  function removeTodo(todoId: string) {
    if (isPreview || isPending) {
      return;
    }

    if (todoId.startsWith("pending-") || createTodoOverride) {
      setLocalTodos((current) => current.filter((todo) => todo.id !== todoId));
      return;
    }

    if (!workspaceId) {
      return;
    }

    const previousTodos = localTodos;
    setLocalTodos((current) => current.filter((todo) => todo.id !== todoId));
    setError(null);

    startTransition(async () => {
      const result = await deleteWorkspaceTodo({ workspaceId, todoId });
      if (!result.ok) {
        setLocalTodos(previousTodos);
        setError(result.message ?? "Failed to remove todo.");
        return;
      }
    });
  }

  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <SectionLabel>Todos</SectionLabel>
        <span className="text-[12.5px] font-medium text-zinc-500">
          {openTodos.length} open
        </span>
      </div>
      {localTodos.length === 0 ? (
        <SideListViewport
          className={cn(
            "flex items-start",
            todosFetching && "sync-zone-fetching",
          )}
        >
          <p className="text-sm text-zinc-500">No todos yet.</p>
        </SideListViewport>
      ) : (
        <SideListViewport as="ul" className="divide-y divide-zinc-200/80">
          {localTodos.map((todo) => {
            const done = Boolean(todo.done);
            const isIncoming = isIncomingId(syncFill, todo.id);
            return (
              <li key={todo.id}>
                <div
                  data-testid="todo-row"
                  data-multiline="false"
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14.5px] text-zinc-800",
                    isIncoming && "sync-item-enter",
                  )}
                >
                  <button
                    data-testid="todo-checkbox"
                    type="button"
                    aria-label={
                      done
                        ? `Mark ${todo.title} open`
                        : `Mark ${todo.title} done`
                    }
                    aria-pressed={done}
                    disabled={!canMutate || isPending}
                    onClick={() => toggleTodo(todo.id)}
                    className={cn(
                      "flex size-[15px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-50",
                      done
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : "border-zinc-300 bg-white hover:border-zinc-400",
                    )}
                  >
                    {done ? <IconCheck className="size-[9px]" /> : null}
                  </button>
                  <span
                    data-testid="todo-title"
                    className={cn(
                      "min-w-0 flex-1 truncate leading-6",
                      done && "text-zinc-400 line-through",
                    )}
                  >
                    {todo.title}
                  </span>
                  {isIncoming ? <NewUpdateBadge /> : null}
                  {canMutate ? (
                    <button
                      type="button"
                      onClick={() => removeTodo(todo.id)}
                      disabled={isPending}
                      aria-label={`Remove ${todo.title}`}
                      className="inline-flex size-5 shrink-0 items-center justify-center rounded text-zinc-300 opacity-0 transition group-hover:opacity-100 hover:text-zinc-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed"
                    >
                      <IconClose className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </SideListViewport>
      )}
      <input
        data-testid="todo-add-input"
        type="text"
        value={draftTitle}
        disabled={!canMutate || isPending}
        placeholder="+ New todo"
        aria-label="New todo"
        onChange={(event) => setDraftTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submitTodo();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setDraftTitle("");
            setError(null);
          }
        }}
        className={cn(
          "mt-2.5 w-full bg-transparent text-[13px] font-medium outline-none focus-visible:outline-none",
          canMutate
            ? "text-zinc-950 placeholder:text-zinc-500 hover:placeholder:text-zinc-950 focus:placeholder:text-zinc-400"
            : "cursor-not-allowed text-zinc-300 placeholder:text-zinc-300",
        )}
      />
      {error ? (
        <p className="mt-2 text-[12.5px] font-medium text-rose-600">{error}</p>
      ) : null}
    </>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 12.5l5 5L20 6.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.2"
      />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SectionRule() {
  return (
    <div
      className="my-10 h-px w-full bg-zinc-200 sm:my-12"
      aria-hidden="true"
    />
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
      {children}
    </h2>
  );
}

function QuietLink({
  href,
  children,
  isPreview = false,
}: {
  href: string;
  children: ReactNode;
  isPreview?: boolean;
}) {
  return (
    <PreviewableLink
      href={href}
      isPreview={isPreview}
      className="text-[12.5px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      previewClassName="cursor-default text-[12.5px] font-medium text-zinc-300"
    >
      {children}
    </PreviewableLink>
  );
}

function PreviewableLink({
  href,
  isPreview,
  className,
  previewClassName,
  children,
  title,
  "aria-label": ariaLabel,
}: {
  href: string;
  isPreview?: boolean;
  className: string;
  previewClassName?: string;
  children: ReactNode;
  title?: string;
  "aria-label"?: string;
}) {
  if (isPreview) {
    return (
      <span
        title={title}
        aria-label={ariaLabel}
        aria-disabled="true"
        className={previewClassName ?? className}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}

function NewUpdateBadge() {
  return (
    <span className="sync-new-badge" aria-label="Just updated">
      New
    </span>
  );
}

function TaskStatusLegend() {
  const items: Array<{ status: WorkspaceWorkStatus; label: string }> = [
    { status: "doing", label: "doing" },
    { status: "todo", label: "todo" },
  ];

  return (
    <span
      className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] font-medium text-zinc-400"
      aria-label="Task status legend"
    >
      {items.map((item) => (
        <span key={item.status} className="inline-flex items-center gap-1">
          <StatusDot status={item.status} />
          {item.label}
        </span>
      ))}
    </span>
  );
}

function StatusDot({ status }: { status: WorkspaceWorkStatus }) {
  return (
    <span
      className={cn(
        "size-[7px] shrink-0 rounded-full",
        status === "doing" && "border-2 border-blue-600",
        status === "done" && "bg-green-600",
        status === "todo" && "border-2 border-zinc-300",
      )}
      aria-hidden="true"
    />
  );
}

function deriveWorkingBrief(
  tasks: WorkspaceWorkItem[],
  logs: WorkspaceLogItem[],
): WorkspaceWorkingBrief | null {
  const task =
    tasks.find((item) => item.status === "doing") ??
    tasks.find((item) => item.status === "todo") ??
    tasks[0];
  if (!task) {
    return null;
  }

  const relatedLogs = logs.filter((log) => log.taskId === task.id);
  const latestLog = relatedLogs[0];
  const activity = resolveTaskActivityMeta(task, relatedLogs);
  const prose =
    task.description?.trim() ||
    getTaskExcerpt(task.body, 220) ||
    latestLog?.description ||
    null;
  if (!prose) {
    return {
      title: task.title,
      prose: "No brief yet for this task.",
      taskId: task.id,
      taskTitle: task.title,
      updatedLabel: activity.lastActivityLabel,
    };
  }

  return {
    title: task.title,
    prose,
    taskId: task.id,
    taskTitle: task.title,
    branch: latestLog?.branch,
    updatedLabel: activity.lastActivityLabel,
  };
}
