import Link from "next/link";
import { useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import {
  activeWorkspaceTaskId,
  countLogsForTask,
  getTaskById,
  getTaskHref,
  workspaceIssues,
  workspaceLogs,
  workspaceMemories,
  workspaceTodos,
  workspaceMonthGrass,
  workspaceMonthLabel,
  workspaceWorkItems,
  type WorkspaceLogItem,
  type WorkspaceTodoItem,
  type WorkspaceWorkItem,
  type WorkspaceWorkStatus,
} from "./data";
import { LogTypeLabel } from "./LogTypeLabel";
import { WorkspaceGuestPrompt } from "./WorkspaceGuestPrompt";

export function WorkspaceView({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [logTaskOverrides, setLogTaskOverrides] = useState<Record<string, string>>(
    {},
  );

  const resolveLogTaskId = (log: WorkspaceLogItem) =>
    logTaskOverrides[log.id] ?? log.taskId;

  const handleAssignLog = (logId: string, taskId: string) => {
    setLogTaskOverrides((current) => ({ ...current, [logId]: taskId }));
    setSelectedTaskId(taskId);
  };

  const handleSelectTask = (taskId: string | null) => {
    setSelectedTaskId(taskId);
    if (taskId) {
      setSelectedLogId(null);
    }
  };

  const handleSelectLog = (logId: string | null) => {
    setSelectedLogId((current) => (current === logId ? null : logId));
  };

  if (!isLoggedIn) {
    return <WorkspaceGuestPrompt />;
  }

  return (
    <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-3.5">
        <NowWorkingCard />
        <WorkTasksCard resolveLogTaskId={resolveLogTaskId} />
        <RecentLogsCard
          selectedTaskId={selectedTaskId}
          selectedLogId={selectedLogId}
          onSelectTask={handleSelectTask}
          onSelectLog={handleSelectLog}
          onAssignLog={handleAssignLog}
          resolveLogTaskId={resolveLogTaskId}
        />
      </div>

      <div className="min-w-0 space-y-3.5">
        <TodosCard />
        <MonthActivityCard />
        <GraphCard />
        <OpenIssuesCard />
        <MemoryCard />
      </div>
    </div>
  );
}

function NowWorkingCard() {
  return (
    <DashboardCard
      title="NOW WORKING"
      action={<IconBranch className="size-[15px] text-zinc-400" />}
    >
      <div className="px-[18px] pb-[18px] pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[17px] font-bold tracking-[-0.01em] text-zinc-950">
            홈 피드 → 워크스페이스 뷰 전환
          </h2>
          <BranchBadge>fix/pnpm</BranchBadge>
        </div>

        <p className="mt-2 max-w-[62ch] text-[13px] leading-[1.6] text-zinc-500">
          WorkspaceView·WorkspaceGuestPrompt 신규 추가, HomeFeedShell에서 로그인
          분기 처리 중. — session summary
        </p>

        <dl className="mt-3 flex flex-wrap gap-x-[18px] gap-y-2 text-[12.5px] tabular-nums text-zinc-500">
          <div>
            Last commit&nbsp;
            <dd className="inline font-semibold text-zinc-950">
              fix: turbopack 버그 수정
            </dd>
          </div>
          <div>
            Uncommitted&nbsp;
            <dd className="inline font-semibold text-zinc-950">+412 −96</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <LinkButton href="/write" tone="solid" size="sm">
            <IconPencil className="size-3.5" />
            Log now
          </LinkButton>
          <LinkButton href="/write" tone="outline" size="sm">
            Generate PR doc
          </LinkButton>
          <LinkButton href="/write" tone="ghost" size="sm">
            View diff
          </LinkButton>
        </div>
      </div>
    </DashboardCard>
  );
}

function WorkTasksCard({
  resolveLogTaskId,
}: {
  resolveLogTaskId: (log: WorkspaceLogItem) => string | undefined;
}) {
  const logsByTask = workspaceLogs.reduce<Record<string, WorkspaceLogItem[]>>(
    (groups, log) => {
      const taskId = resolveLogTaskId(log);
      if (!taskId) return groups;
      groups[taskId] = [...(groups[taskId] ?? []), log];
      return groups;
    },
    {},
  );

  return (
    <DashboardCard
      title="TASKS"
      titleAside={<TaskStatusLegend />}
      action={<HeaderLink href="/write" />}
    >
      <PanelList>
        {workspaceWorkItems.map((item) => (
          <WorkItemRow
            key={item.id}
            item={item}
            logCount={logsByTask[item.id]?.length ?? countLogsForTask(item.id)}
          />
        ))}
      </PanelList>
      <Link
        href="/write"
        className="block border-t border-zinc-100 px-[18px] py-2.5 text-[12.5px] font-medium text-zinc-400 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        + New task
      </Link>
    </DashboardCard>
  );
}

function WorkItemRow({
  item,
  logCount,
}: {
  item: WorkspaceWorkItem;
  logCount: number;
}) {
  const statusLabel =
    item.status === "doing"
      ? "doing"
      : item.status === "done"
        ? "done"
        : "todo";

  return (
    <PanelItem align="start">
      <TaskStatusDot status={item.status} />
      <div className="min-w-0 flex-1">
        <h3 className="text-[13px] font-semibold leading-[1.45] text-zinc-950">
          {item.title}
        </h3>
        <p className="mt-0.5 text-[12px] text-zinc-500">
          {statusLabel} · {logCount} log{logCount === 1 ? "" : "s"}
        </p>
      </div>
      <Link
        href={getTaskHref(item.id)}
        aria-label={`Open ${item.title}`}
        className="shrink-0 self-center text-zinc-400 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <IconArrowRight className="size-4" />
      </Link>
    </PanelItem>
  );
}

function TaskStatusDot({
  status,
  size = "md",
  className,
}: {
  status: WorkspaceWorkStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full",
        size === "sm" ? "size-[7px]" : "mt-[5px] size-[9px]",
        status === "doing" && "border-2 border-blue-600",
        status === "done" && "bg-green-600",
        status === "todo" && "border-2 border-zinc-300",
        className,
      )}
    />
  );
}

function TaskStatusLegend() {
  const items: Array<{ status: WorkspaceWorkStatus; label: string }> = [
    { status: "doing", label: "doing" },
    { status: "done", label: "done" },
    { status: "todo", label: "todo" },
  ];

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-medium normal-case tracking-normal text-zinc-400">
      {items.map((item) => (
        <span key={item.status} className="inline-flex items-center gap-1">
          <TaskStatusDot status={item.status} size="sm" />
          {item.label}
        </span>
      ))}
    </span>
  );
}

function TodosCard() {
  const [activeTab, setActiveTab] = useState<"today" | "week">("today");

  return (
    <DashboardCard
      title="TODOS"
      action={
        <MiniTabs
          active={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "today", label: "Today" },
            { key: "week", label: "Week" },
          ]}
        />
      }
    >
      <PanelList>
        {workspaceTodos.map((todo) => (
          <TodoRow key={todo.id} todo={todo} />
        ))}
      </PanelList>
      <Link
        href="/write"
        className="block border-t border-zinc-100 px-[18px] py-2.5 text-[12.5px] font-medium text-zinc-400 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        + Add todo
      </Link>
    </DashboardCard>
  );
}

function TodoRow({ todo }: { todo: WorkspaceTodoItem }) {
  return (
    <PanelItem align="start">
      <span
        className={cn(
          "mt-[2.5px] flex size-[15px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px]",
          todo.done
            ? "border-zinc-950 bg-zinc-950 text-white"
            : "border-zinc-300 bg-white",
        )}
      >
        {todo.done ? <IconCheck className="size-[9px]" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <h3
          className={cn(
            "text-[13px] font-semibold leading-[1.45] text-zinc-950",
            todo.done && "text-zinc-400 line-through",
          )}
        >
          {todo.title}
        </h3>
        {todo.description ? (
          <p className="mt-0.5 text-[12px] text-zinc-500">{todo.description}</p>
        ) : null}
      </div>
    </PanelItem>
  );
}

function RecentLogsCard({
  selectedTaskId,
  selectedLogId,
  onSelectTask,
  onSelectLog,
  onAssignLog,
  resolveLogTaskId,
}: {
  selectedTaskId: string | null;
  selectedLogId: string | null;
  onSelectTask: (taskId: string | null) => void;
  onSelectLog: (logId: string | null) => void;
  onAssignLog: (logId: string, taskId: string) => void;
  resolveLogTaskId: (log: WorkspaceLogItem) => string | undefined;
}) {
  const unassignedCount = workspaceLogs.filter(
    (log) => !resolveLogTaskId(log),
  ).length;

  return (
    <DashboardCard title="RECENT LOGS" action={<HeaderLink href="/write" />}>
      {unassignedCount > 0 ? (
        <p className="px-[18px] pt-1 text-[11.5px] text-zinc-400">
          {unassignedCount} unassigned · review when ready
        </p>
      ) : null}
      <div className="pb-1.5 pt-1.5">
        {workspaceLogs.map((item) => {
          const taskId = resolveLogTaskId(item);
          return (
            <WorkspaceLogRow
              key={item.id}
              item={item}
              task={taskId ? getTaskById(taskId) : undefined}
              highlighted={selectedTaskId != null && taskId === selectedTaskId}
              expanded={selectedLogId === item.id}
              siblingCount={
                taskId
                  ? workspaceLogs.filter((log) => resolveLogTaskId(log) === taskId)
                      .length - 1
                  : 0
              }
              onSelectTask={onSelectTask}
              onToggle={() => onSelectLog(item.id)}
              onAssign={() => onAssignLog(item.id, activeWorkspaceTaskId)}
            />
          );
        })}
      </div>
    </DashboardCard>
  );
}

function MonthActivityCard() {
  return (
    <DashboardCard
      title="THIS MONTH"
      action={<HeaderLink href="/write" label="Planner" />}
    >
      <p className="px-[18px] pt-1 text-[12px] font-medium text-zinc-500">
        {workspaceMonthLabel}
      </p>
      <div className="overflow-x-auto px-4 pb-1 pt-2.5">
        <div className="inline-flex min-w-full justify-center gap-[3px]">
          {workspaceMonthGrass.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((cell, dayIndex) =>
                cell.day === null ? (
                  <span
                    key={dayIndex}
                    className="size-[11px] shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <GrassCell
                    key={dayIndex}
                    day={cell.day}
                    logCount={cell.logCount}
                    isToday={cell.isToday}
                    isFuture={cell.isFuture}
                    size="sm"
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <GrassLegend />
    </DashboardCard>
  );
}

const GRASS_EMPTY = "bg-zinc-100";
const GRASS_FUTURE = "border border-dashed border-orange-200/70 bg-orange-50/40";
const GRASS_LEVELS = [
  GRASS_EMPTY,
  "bg-[#fce8e0]",
  "bg-[#f0c4b0]",
  "bg-[#da7756]",
  "bg-[#a85638]",
] as const;

function getGrassLevel(logCount: number) {
  if (logCount <= 0) return 0;
  if (logCount === 1) return 1;
  if (logCount === 2) return 2;
  if (logCount === 3) return 3;
  return 4;
}

function GrassCell({
  day,
  logCount,
  isToday,
  isFuture,
  size = "md",
}: {
  day?: number;
  logCount: number;
  isToday?: boolean;
  isFuture?: boolean;
  size?: "sm" | "md";
}) {
  const dateLabel = day ? `Jul ${day}` : "";
  const countLabel =
    logCount === 0
      ? isFuture
        ? "Planned"
        : "No logs"
      : `${logCount} log${logCount === 1 ? "" : "s"}`;
  const label = day ? `${dateLabel} · ${countLabel}` : countLabel;

  return (
    <div
      title={label}
      aria-label={label}
      className={cn(
        "shrink-0 rounded-[2px]",
        size === "sm" ? "size-[11px]" : "aspect-square w-full max-w-[38px] rounded-[3px]",
        getGrassTone(logCount, isFuture),
        isToday &&
          (size === "sm"
            ? "ring-1 ring-[#a85638] ring-offset-1 ring-offset-white"
            : "ring-2 ring-[#a85638] ring-offset-2 ring-offset-white"),
      )}
    />
  );
}

function getGrassTone(logCount: number, isFuture?: boolean) {
  if (logCount === 0) {
    return isFuture ? GRASS_FUTURE : GRASS_EMPTY;
  }

  return GRASS_LEVELS[getGrassLevel(logCount)];
}

function GrassLegend() {
  const levels = [0, 1, 2, 3, 4] as const;

  return (
    <div className="flex items-center justify-end gap-1.5 px-[18px] pb-3.5 pt-2 text-[10px] text-zinc-400">
      <span>Less</span>
      <div className="flex items-center gap-[3px]">
        {levels.map((level) => (
          <span
            key={level}
            className={cn("size-[11px] rounded-[2px]", GRASS_LEVELS[level])}
          />
        ))}
      </div>
      <span>More</span>
    </div>
  );
}

function GraphCard() {
  return (
    <DashboardCard
      title="GRAPH"
      action={<HeaderLink href="/write" label="Open full view" />}
    >
      <div className="mx-[18px] mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
        <svg viewBox="0 0 264 150" fill="none" aria-hidden="true" className="block w-full">
          <path
            d="M118 78L62 44M118 78L56 110M118 78L152 34M118 78L204 57M118 78L196 116M62 44L152 34"
            stroke="#d4d4d8"
            strokeWidth="1.2"
          />
          <circle cx="62" cy="44" r="5" fill="#a1a1aa" />
          <circle cx="56" cy="110" r="5" fill="#a1a1aa" />
          <circle cx="152" cy="34" r="5" fill="#a1a1aa" />
          <circle cx="118" cy="78" r="7.5" fill="#09090b" />
          <text x="118" y="99" textAnchor="middle" fontSize="9" fill="#71717a">
            current log
          </text>
          <circle cx="204" cy="57" r="6" fill="#2563eb" />
          <text x="204" y="43" textAnchor="middle" fontSize="9" fill="#71717a">
            post
          </text>
          <circle
            cx="196"
            cy="116"
            r="6"
            fill="#ffffff"
            stroke="#09090b"
            strokeWidth="1.6"
          />
          <text x="196" y="137" textAnchor="middle" fontSize="9" fill="#71717a">
            memory
          </text>
        </svg>
      </div>
      <p className="mx-[18px] mb-[15px] mt-2.5 text-[12px] text-zinc-400">
        이 프로젝트의 log·post·memory 파생 관계.
      </p>
    </DashboardCard>
  );
}

function OpenIssuesCard() {
  return (
    <DashboardCard title="OPEN ISSUES" action={<HeaderLink href="/write" />}>
      <PanelList>
        {workspaceIssues.map((issue) => (
          <PanelItem key={issue.title} align="start">
            <span className="mt-[5px] size-2 shrink-0 rounded-full border-[1.5px] border-amber-700" />
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold leading-[1.45] text-zinc-950">
                {issue.title}
              </h3>
              <p className="mt-0.5 text-[12px] text-zinc-500">
                {issue.description}
              </p>
            </div>
          </PanelItem>
        ))}
      </PanelList>
    </DashboardCard>
  );
}

function WorkspaceLogRow({
  item,
  task,
  highlighted,
  expanded,
  siblingCount,
  onSelectTask,
  onToggle,
  onAssign,
}: {
  item: WorkspaceLogItem;
  task?: WorkspaceWorkItem;
  highlighted?: boolean;
  expanded?: boolean;
  siblingCount: number;
  onSelectTask: (taskId: string | null) => void;
  onToggle: () => void;
  onAssign: () => void;
}) {
  return (
    <article
      className={cn(
        "border-t border-zinc-100 px-[18px] py-3 first:border-t-0",
        highlighted && "bg-orange-50/40",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-semibold text-zinc-950">{item.title}</h3>
          </div>
          <p className="mt-0.5 text-[12.5px] leading-5 text-zinc-500">
            {item.description}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-zinc-400">
            <LogTypeLabel>{item.label}</LogTypeLabel>
            {task ? (
              <TaskLinkChip
                label={task.title}
                onClick={() => onSelectTask(task.id)}
              />
            ) : null}
            {item.branch ? <CodePill>{item.branch}</CodePill> : null}
            <span>{item.meta}</span>
            {item.commit ? <CodePill>{item.commit}</CodePill> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? "Close log details" : `Open ${item.title}`}
          aria-expanded={expanded}
          className="shrink-0 self-center text-zinc-400 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          {expanded ? (
            <span className="text-[12.5px] font-medium">Close</span>
          ) : (
            <IconArrowRight className="size-4" />
          )}
        </button>
      </div>
      {expanded ? (
        <LogTaskPanel
          task={task}
          captureBranch={item.branch}
          siblingCount={Math.max(0, siblingCount)}
          onSelectTask={onSelectTask}
          onAssign={onAssign}
        />
      ) : null}
    </article>
  );
}

function TaskLinkChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="inline-flex max-w-[148px] items-center truncate rounded-md bg-zinc-100 px-[7px] py-0.5 text-[10.5px] font-semibold text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
    >
      {label}
    </button>
  );
}

function LogTaskPanel({
  task,
  captureBranch,
  siblingCount,
  onSelectTask,
  onAssign,
}: {
  task?: WorkspaceWorkItem;
  captureBranch?: string;
  siblingCount: number;
  onSelectTask: (taskId: string | null) => void;
  onAssign: () => void;
}) {
  const activeTask = getTaskById(activeWorkspaceTaskId);

  return (
    <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3">
      {task ? (
        <div className="space-y-2">
          <p className="text-[12px] text-zinc-500">
            Part of{" "}
            <button
              type="button"
              onClick={() => onSelectTask(task.id)}
              className="font-semibold text-zinc-950 underline-offset-2 hover:underline"
            >
              {task.title}
            </button>
          </p>
          {captureBranch ? (
            <p className="text-[11px] text-zinc-400">
              Captured on{" "}
              <span className="font-mono text-zinc-500">{captureBranch}</span>
            </p>
          ) : null}
          {siblingCount > 0 ? (
            <button
              type="button"
              onClick={() => onSelectTask(task.id)}
              className="text-[12px] font-medium text-zinc-500 hover:text-zinc-950"
            >
              {siblingCount} more log{siblingCount === 1 ? "" : "s"} in this task
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-[12px] text-zinc-500">No task</span>
          {activeTask ? (
            <button
              type="button"
              onClick={onAssign}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              Assign to {activeTask.title}
            </button>
          ) : null}
          {captureBranch ? (
            <span className="text-[11px] text-zinc-400">
              on{" "}
              <span className="font-mono text-zinc-500">{captureBranch}</span>
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

function MemoryCard() {
  return (
    <DashboardCard title="PROJECT MEMORY">
      <div className="pb-2 pt-1">
        {workspaceMemories.map((memory) => (
          <article
            key={memory.title}
            className="border-t border-zinc-100 px-[18px] py-2.5 first:border-t-0"
          >
            <h3 className="text-[13px] font-semibold text-zinc-950">
              {memory.title}
            </h3>
            <p className="mt-0.5 text-[12px] leading-5 text-zinc-500">
              {memory.description}
            </p>
            <div className="mt-1.5 flex gap-2.5 font-mono text-[10.5px] text-zinc-400">
              <span>{memory.source}</span>
              <span>{memory.reads}</span>
            </div>
          </article>
        ))}
      </div>
    </DashboardCard>
  );
}

function DashboardCard({
  title,
  titleAside,
  action,
  children,
}: {
  title: string;
  titleAside?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
      <div className="flex items-center justify-between gap-3 px-[18px] pt-3.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
          <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            {title}
          </h2>
          {titleAside}
        </div>
        {action ? (
          <div className="flex shrink-0 items-center gap-2.5 text-zinc-400">
            {action}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function PanelList({ children }: { children: ReactNode }) {
  return <div className="pb-2 pt-1">{children}</div>;
}

function PanelItem({
  align = "center",
  children,
}: {
  align?: "center" | "start";
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex gap-[11px] border-t border-zinc-100 px-[18px] py-2 first:border-t-0",
        align === "center" ? "items-center" : "items-start",
      )}
    >
      {children}
    </article>
  );
}

function MiniTabs<T extends string>({
  active,
  onChange,
  items,
}: {
  active: T;
  onChange: (value: T) => void;
  items: Array<{ key: T; label: string }>;
}) {
  return (
    <div className="inline-flex gap-0.5">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={cn(
            "rounded-full px-[11px] py-[3px] text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
            active === item.key
              ? "bg-zinc-100 text-zinc-950"
              : "text-zinc-400 hover:text-zinc-950",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function BranchBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11.5px] font-medium text-zinc-600">
      <IconBranch className="size-3 text-zinc-400" />
      {children}
    </span>
  );
}

function CodePill({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-zinc-100 px-[7px] py-0.5 font-mono text-[10.5px] text-zinc-500">
      {children}
    </code>
  );
}

function HeaderLink({
  href,
  label = "View all",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="text-[12px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
    >
      {label}
    </Link>
  );
}

function LinkButton({
  href,
  tone,
  size = "md",
  children,
}: {
  href: string;
  tone: "solid" | "outline" | "ghost";
  size?: "md" | "sm";
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        size === "sm"
          ? "h-[30px] rounded-[10px] px-[13px] text-[12.5px]"
          : "h-9 rounded-xl px-4 text-[13.5px]",
        tone === "solid" && "bg-zinc-950 text-white hover:bg-zinc-800",
        tone === "outline" &&
          "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50",
        tone === "ghost" && "text-zinc-500 hover:text-zinc-950",
      )}
    >
      {children}
    </Link>
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

function IconBranch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="6" cy="5" r="2.3" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="19" r="2.3" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="8" r="2.3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M6 7.3v9.4M18 10.3c0 3-4 4.7-9 5.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
