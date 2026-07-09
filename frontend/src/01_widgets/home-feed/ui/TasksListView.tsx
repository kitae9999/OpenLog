"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import {
  getNewTaskHref,
  getTabHref,
  getTaskExcerpt,
  getTaskHref,
  getTaskMeta,
  workspaceLogs,
  workspaceTaskOutputs,
  workspaceWorkItems,
  type TaskListFilter,
  type WorkspaceLogItem,
  type WorkspaceTaskOutput,
  type WorkspaceWorkItem,
  type WorkspaceWorkStatus,
} from "./data";
import { mergeTaskWithOverrides } from "./taskOverrides";
import type { WorkspaceUiData } from "./workspaceTypes";

const filterItems: Array<{ key: TaskListFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "doing", label: "Doing" },
  { key: "todo", label: "Todo" },
  { key: "done", label: "Done" },
];

export function TasksListView({
  isLoggedIn,
  workspaceData,
}: {
  isLoggedIn: boolean;
  workspaceData?: WorkspaceUiData | null;
}) {
  const initialTasks = workspaceData?.tasks ?? workspaceWorkItems;
  const logs = workspaceData?.logs ?? workspaceLogs;
  const outputs = workspaceData?.outputs ?? workspaceTaskOutputs;
  const [filter, setFilter] = useState<TaskListFilter>("all");
  const tasks = useMemo(
    () =>
      workspaceData
        ? initialTasks
        : initialTasks.map((task) => mergeTaskWithOverrides(task)),
    [initialTasks, workspaceData],
  );

  const filteredTasks = useMemo(
    () =>
      filter === "all"
        ? tasks
        : tasks.filter((task) => task.status === filter),
    [filter, tasks],
  );

  const doingCount = tasks.filter((task) => task.status === "doing").length;

  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href={getTabHref("workspace", isLoggedIn)}
          className="font-semibold text-zinc-700 transition hover:text-zinc-950"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">Tasks</span>
      </nav>

      <article className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
        <header className="border-b border-zinc-100 px-6 pb-2.5 pt-[22px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-[family-name:var(--font-georgia,Georgia,serif)] text-2xl font-bold tracking-[-0.01em] text-zinc-950">
                Tasks
              </h1>
              <p className="mt-1.5 text-[13px] text-zinc-500">
                {tasks.length} total
                {doingCount > 0 ? ` · ${doingCount} in progress` : ""}
              </p>
            </div>
            <LinkButton href={getNewTaskHref()} tone="solid" size="sm">
              + New task
            </LinkButton>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {filterItems.map((item) => {
              const count =
                item.key === "all"
                  ? tasks.length
                  : tasks.filter((task) => task.status === item.key).length;

              return (
                <FilterChip
                  key={item.key}
                  active={filter === item.key}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                  <span className="tabular-nums text-zinc-400">{count}</span>
                </FilterChip>
              );
            })}
            <span className="ml-1 hidden sm:inline">
              <TaskStatusLegend />
            </span>
          </div>
        </header>

        <div className="px-[18px] pb-2 pt-1">
          {filteredTasks.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-zinc-500">
              No tasks in this view.
            </p>
          ) : (
            filteredTasks.map((task) => (
              <TaskListRow
                key={task.id}
                task={task}
                logs={logs}
                outputs={outputs}
              />
            ))
          )}
        </div>
      </article>
    </div>
  );
}

function TaskListRow({
  task,
  logs,
  outputs,
}: {
  task: WorkspaceWorkItem;
  logs: WorkspaceLogItem[];
  outputs: WorkspaceTaskOutput[];
}) {
  const taskLogs = logs.filter((log) => log.taskId === task.id);
  const logCount = taskLogs.length;
  const outputCount = outputs.filter((output) =>
    output.taskIds.includes(task.id),
  ).length;
  const meta = getTaskMeta(task.id);
  const excerpt = getTaskExcerpt(task.body);
  const statusLabel =
    task.status === "doing"
      ? "doing"
      : task.status === "done"
        ? "done"
        : "todo";

  return (
    <article className="flex items-start gap-3 border-t border-zinc-100 py-3.5 first:border-t-0">
      <TaskStatusDot status={task.status} className="mt-1" />
      <div className="min-w-0 flex-1">
        <h2 className="text-[15px] font-semibold leading-snug text-zinc-950">
          {task.title}
        </h2>
        {excerpt ? (
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-5 text-zinc-500">
            {excerpt}
          </p>
        ) : null}
        <p className="mt-1.5 text-[11.5px] text-zinc-400">
          <span className="font-medium text-zinc-500">{statusLabel}</span>
          {" · "}
          {logCount} log{logCount === 1 ? "" : "s"}
          {outputCount > 0
            ? ` · ${outputCount} output${outputCount === 1 ? "" : "s"}`
            : ""}
          {" · "}
          Last {taskLogs[0]?.meta.split(" · ")[0] ?? meta.lastActivityLabel}
        </p>
      </div>
      <Link
        href={getTaskHref(task.id)}
        aria-label={`Open ${task.title}`}
        className="shrink-0 self-center text-zinc-400 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <IconArrowRight className="size-4" />
      </Link>
    </article>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        active
          ? "bg-zinc-950 text-white"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950",
      )}
    >
      {children}
    </button>
  );
}

function TaskStatusLegend() {
  const items: Array<{ status: WorkspaceWorkStatus; label: string }> = [
    { status: "doing", label: "doing" },
    { status: "done", label: "done" },
    { status: "todo", label: "todo" },
  ];

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-medium text-zinc-400">
      {items.map((item) => (
        <span key={item.status} className="inline-flex items-center gap-1">
          <TaskStatusDot status={item.status} size="sm" />
          {item.label}
        </span>
      ))}
    </span>
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
        size === "sm" ? "size-[7px]" : "size-[9px]",
        status === "doing" && "border-2 border-blue-600",
        status === "done" && "bg-green-600",
        status === "todo" && "border-2 border-zinc-300",
        className,
      )}
    />
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
        "inline-flex items-center justify-center gap-1.5 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
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
