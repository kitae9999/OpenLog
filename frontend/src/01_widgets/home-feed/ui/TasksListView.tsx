"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";
import {
  getNewTaskHref,
  getTabHref,
  getTaskExcerpt,
  getTaskHref,
  getTaskMeta,
  type TaskListFilter,
  type WorkspaceLogItem,
  type WorkspaceTaskOutput,
  type WorkspaceWorkItem,
  type WorkspaceWorkStatus,
} from "./data";
import { mergeTaskWithOverrides } from "./taskOverrides";
import {
  DocumentBulkBar,
  SelectionCheckbox,
  useDocumentSelection,
} from "./DocumentBulkSelection";
import { deleteWorkspaceDocuments } from "./workspaceActions";
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
  const router = useRouter();
  const logs = workspaceData?.logs ?? [];
  const outputs = workspaceData?.outputs ?? [];
  const [filter, setFilter] = useState<TaskListFilter>("all");
  const tasks = useMemo(() => {
    const initialTasks = workspaceData?.tasks ?? [];
    return workspaceData
      ? initialTasks
      : initialTasks.map((task) => mergeTaskWithOverrides(task));
  }, [workspaceData]);

  const filteredTasks = useMemo(
    () =>
      filter === "all"
        ? tasks
        : tasks.filter((task) => task.status === filter),
    [filter, tasks],
  );

  const doingCount = tasks.filter((task) => task.status === "doing").length;
  const selection = useDocumentSelection(filteredTasks.map((task) => task.id));
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function changeFilter(nextFilter: TaskListFilter) {
    setFilter(nextFilter);
    selection.clear();
    setDeleteError(null);
  }

  async function deleteSelectedTasks() {
    if (!workspaceData || isDeleting || selection.selectedIdList.length === 0) {
      return false;
    }
    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteWorkspaceDocuments({
      workspaceId: workspaceData.workspaceId,
      documentType: "tasks",
      ids: selection.selectedIdList,
    });
    setIsDeleting(false);
    if (!result.ok) {
      setDeleteError(result.message ?? "Failed to delete selected tasks.");
      return false;
    }
    selection.clear();
    router.refresh();
    return true;
  }

  return (
    <div className="mx-auto w-full max-w-[920px]">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href={getTabHref("workspace", isLoggedIn)}
          className="font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">Tasks</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3 pb-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
              Tasks
            </h1>
            <TaskStatusLegend />
          </div>
          <p className="mt-1.5 text-[13px] text-zinc-500">
            {tasks.length} total
            {doingCount > 0 ? ` · ${doingCount} in progress` : ""}
          </p>
        </div>
        <Link
          href={getNewTaskHref()}
          className="inline-flex text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          + New task
        </Link>
      </header>

      <div
        role="tablist"
        aria-label="Task filters"
        className="flex flex-wrap items-end gap-1 border-b border-zinc-200"
      >
        {filterItems.map((item) => {
          const active = filter === item.key;
          const count =
            item.key === "all"
              ? tasks.length
              : tasks.filter((task) => task.status === item.key).length;

          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => changeFilter(item.key)}
              className={cn(
                "group relative h-9 cursor-pointer px-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                active
                  ? "text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-950",
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                {item.label}
                <span
                  className={cn(
                    "tabular-nums transition",
                    active
                      ? "text-zinc-500"
                      : "text-zinc-400 group-hover:text-zinc-500",
                  )}
                >
                  {count}
                </span>
              </span>
              {active ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 bg-zinc-950" />
              ) : (
                <span className="absolute inset-x-2 -bottom-px h-0.5 bg-zinc-300 opacity-0 transition group-hover:opacity-100" />
              )}
            </button>
          );
        })}
      </div>

      {workspaceData ? (
        <DocumentBulkBar
          visibleCount={filteredTasks.length}
          selectedCount={selection.selectedIds.size}
          allVisibleSelected={selection.allVisibleSelected}
          someVisibleSelected={selection.someVisibleSelected}
          documentLabel="tasks"
          deleteImpact="Linked records will be kept."
          isDeleting={isDeleting}
          error={deleteError}
          onToggleAll={selection.toggleAllVisible}
          onClear={selection.clear}
          onDelete={deleteSelectedTasks}
        />
      ) : null}

      {filteredTasks.length === 0 ? (
        <p className="mt-10 pl-5 text-sm text-zinc-500">No tasks in this view.</p>
      ) : (
        <ul className="mt-2">
          {filteredTasks.map((task) => (
            <TaskListRow
              key={task.id}
              task={task}
              logs={logs}
              outputs={outputs}
              selected={selection.selectedIds.has(task.id)}
              onToggle={() => selection.toggle(task.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskListRow({
  task,
  logs,
  outputs,
  selected,
  onToggle,
}: {
  task: WorkspaceWorkItem;
  logs: WorkspaceLogItem[];
  outputs: WorkspaceTaskOutput[];
  selected: boolean;
  onToggle: () => void;
}) {
  const taskLogs = logs.filter((log) => log.taskId === task.id);
  const logCount = taskLogs.length;
  const outputCount = outputs.filter((output) =>
    output.taskIds.includes(task.id),
  ).length;
  const meta = getTaskMeta(task.id);
  const excerpt = getTaskExcerpt(task.body);

  return (
    <li className="border-t border-zinc-200/80 first:border-t-0">
      <div
        className={cn(
          "group rounded-lg px-2.5 py-2.5 transition",
          selected ? "bg-zinc-50" : "hover:bg-zinc-50",
        )}
      >
        <div className="grid grid-cols-[17px_minmax(0,1fr)_7px] items-center gap-x-2.5">
          <SelectionCheckbox
            checked={selected}
            label={`${selected ? "Deselect" : "Select"} ${task.title}`}
            onChange={onToggle}
          />
          <Link
            href={getTaskHref(task.id)}
            className="min-w-0 truncate text-[14.5px] font-medium leading-5 text-zinc-950 transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            {task.title}
          </Link>
          <TaskStatusDot status={task.status} title={task.status} />
        </div>
        {excerpt ? (
          <p className="mt-1 pl-[calc(17px+0.625rem)] line-clamp-2 text-[12.5px] leading-5 text-zinc-500">
            {excerpt}
          </p>
        ) : null}
        <p className="mt-1.5 pl-[calc(17px+0.625rem)] text-[12px] text-zinc-400">
          {logCount} log{logCount === 1 ? "" : "s"}
          {outputCount > 0
            ? ` · ${outputCount} output${outputCount === 1 ? "" : "s"}`
            : ""}
          {" · "}
          Last {taskLogs[0]?.meta.split(" · ")[0] ?? meta.lastActivityLabel}
        </p>
      </div>
    </li>
  );
}

function TaskStatusLegend() {
  const items: Array<{ status: WorkspaceWorkStatus; label: string }> = [
    { status: "doing", label: "doing" },
    { status: "done", label: "done" },
    { status: "todo", label: "todo" },
  ];

  return (
    <span
      className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] font-medium text-zinc-400"
      aria-label="Task status legend"
    >
      {items.map((item) => (
        <span key={item.status} className="inline-flex items-center gap-1">
          <TaskStatusDot status={item.status} />
          {item.label}
        </span>
      ))}
    </span>
  );
}

function TaskStatusDot({
  status,
  className,
  title,
}: {
  status: WorkspaceWorkStatus;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "size-[7px] shrink-0 rounded-full",
        status === "doing" && "border-2 border-blue-600",
        status === "done" && "bg-green-600",
        status === "todo" && "border-2 border-zinc-300",
        className,
      )}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    />
  );
}
