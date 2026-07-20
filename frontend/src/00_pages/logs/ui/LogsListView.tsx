"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/shared/lib/cn";
import { LogTypeLabel } from "@/entities/workspace/ui/LogTypeLabel";
import {
  buildLogsListHref,
  getLogHref,
  getLogListTitle,
  getNewLogHref,
  getTabHref,
  getTaskHref,
  logsSubnavItems,
  type LogListTypeFilter,
  type LogTaskFilter,
  type WorkspaceLogItem,
  type WorkspaceWorkItem,
} from "@/entities/workspace/model/data";
import { mergeLogWithOverrides } from "@/features/document-overrides/model/logOverrides";
import {
  DocumentBulkBar,
  SelectionCheckbox,
  useDocumentSelection,
} from "@/features/document-selection/ui/DocumentBulkSelection";
import { deleteWorkspaceDocuments } from "@/features/workspace-actions/api/workspaceActions";
import type { WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";
import { useInvalidateWorkspaceQueries } from "@/features/workspace-query/model/useInvalidateWorkspaceQueries";

type SortFilter = "newest" | "oldest";

export function LogsListView({
  isLoggedIn,
  typeFilter,
  workspaceData,
}: {
  isLoggedIn: boolean;
  typeFilter: LogListTypeFilter;
  workspaceData?: WorkspaceUiData | null;
}) {
  const router = useRouter();
  const invalidateWorkspace = useInvalidateWorkspaceQueries();
  const searchParams = useSearchParams();
  const tasks = workspaceData?.tasks ?? [];
  const logs = useMemo(() => {
    const initialLogs = workspaceData?.logs ?? [];
    return workspaceData
      ? initialLogs
      : initialLogs.map((log) => mergeLogWithOverrides(log));
  }, [workspaceData]);
  const [sortFilter, setSortFilter] = useState<SortFilter>("newest");

  const taskFilter = parseTaskFilter(searchParams.get("task"));
  const title = getLogListTitle(typeFilter);
  const unassignedForType = logs.filter(
    (log) => matchesLogTypeFilter(log, typeFilter) && !log.taskId,
  ).length;
  const taskFilters = getTaskFiltersForLogs(tasks, logs, typeFilter);

  const filteredLogs = useMemo(() => {
    const items = logs.filter((log) => {
      if (!matchesLogTypeFilter(log, typeFilter)) {
        return false;
      }
      if (taskFilter === "unassigned") {
        return !log.taskId;
      }
      if (taskFilter !== "all") {
        return log.taskId === taskFilter;
      }
      return true;
    });

    if (sortFilter === "oldest") {
      return [...items].reverse();
    }

    return items;
  }, [logs, typeFilter, taskFilter, sortFilter]);
  const selection = useDocumentSelection(filteredLogs.map((log) => log.id));
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const taskLabel = getTaskFilterLabel(taskFilter, taskFilters);

  function setTypeFilter(next: LogListTypeFilter) {
    selection.clear();
    setDeleteError(null);
    router.push(buildLogsListHref(next, taskFilter));
  }

  function setTaskFilter(next: LogTaskFilter) {
    selection.clear();
    setDeleteError(null);
    router.push(buildLogsListHref(typeFilter, next));
  }

  async function deleteSelectedLogs() {
    if (!workspaceData || isDeleting || selection.selectedIdList.length === 0) {
      return false;
    }
    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteWorkspaceDocuments({
      workspaceId: workspaceData.workspaceId,
      documentType: "logs",
      ids: selection.selectedIdList,
    });
    setIsDeleting(false);
    if (!result.ok) {
      setDeleteError(result.message ?? "Failed to delete selected logs.");
      return false;
    }
    selection.clear();
    await invalidateWorkspace("logs");
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
        <span className="font-semibold text-zinc-950">{title}</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3 pb-6">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
            {title}
          </h1>
          <p className="mt-1.5 text-[13px] text-zinc-500">
            <span className="tabular-nums">{filteredLogs.length}</span> log
            {filteredLogs.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href={getNewLogHref()}
          className="inline-flex text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          + New log
        </Link>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-zinc-200">
        <div
          role="tablist"
          aria-label="Log type filters"
          className="flex flex-wrap items-end gap-1"
        >
          {logsSubnavItems.map((item) => {
            const active = typeFilter === item.key;
            const count = countLogsByType(logs, item.key);

            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTypeFilter(item.key)}
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

        <div className="mb-1 flex flex-wrap items-center gap-0.5">
          <FilterDropdown
            label="Task"
            active={taskFilter !== "all"}
            valueLabel={taskLabel}
          >
            {(close) => (
              <>
                <FilterMenuItem
                  active={taskFilter === "all"}
                  onClick={() => {
                    setTaskFilter("all");
                    close();
                  }}
                >
                  All tasks
                </FilterMenuItem>
                {(unassignedForType > 0 || taskFilter === "unassigned") && (
                  <FilterMenuItem
                    active={taskFilter === "unassigned"}
                    onClick={() => {
                      setTaskFilter("unassigned");
                      close();
                    }}
                  >
                    Unassigned
                    <span className="ml-auto tabular-nums text-zinc-400">
                      {unassignedForType}
                    </span>
                  </FilterMenuItem>
                )}
                {taskFilters.map((task) => (
                  <FilterMenuItem
                    key={task.id}
                    active={taskFilter === task.id}
                    onClick={() => {
                      setTaskFilter(task.id);
                      close();
                    }}
                  >
                    <span className="truncate">{task.title}</span>
                  </FilterMenuItem>
                ))}
              </>
            )}
          </FilterDropdown>

          <FilterDropdown
            label="Sort"
            active={sortFilter !== "newest"}
            valueLabel={sortFilter === "oldest" ? "Oldest" : "Newest"}
          >
            {(close) => (
              <>
                <FilterMenuItem
                  active={sortFilter === "newest"}
                  onClick={() => {
                    setSortFilter("newest");
                    close();
                  }}
                >
                  Newest
                </FilterMenuItem>
                <FilterMenuItem
                  active={sortFilter === "oldest"}
                  onClick={() => {
                    setSortFilter("oldest");
                    close();
                  }}
                >
                  Oldest
                </FilterMenuItem>
              </>
            )}
          </FilterDropdown>
        </div>
      </div>

      {workspaceData ? (
        <DocumentBulkBar
          visibleCount={filteredLogs.length}
          selectedCount={selection.selectedIds.size}
          allVisibleSelected={selection.allVisibleSelected}
          someVisibleSelected={selection.someVisibleSelected}
          documentLabel="logs"
          deleteImpact="Linked memories will be kept."
          isDeleting={isDeleting}
          error={deleteError}
          onToggleAll={selection.toggleAllVisible}
          onClear={selection.clear}
          onDelete={deleteSelectedLogs}
        />
      ) : null}

      {filteredLogs.length === 0 ? (
        <p className="mt-10 pl-5 text-sm text-zinc-500">No logs match this view.</p>
      ) : (
        <ul className="mt-2">
          {filteredLogs.map((log) => (
            <LogListRow
              key={log.id}
              log={log}
              task={
                log.taskId
                  ? tasks.find((task) => task.id === log.taskId)
                  : undefined
              }
              selected={selection.selectedIds.has(log.id)}
              onToggle={() => selection.toggle(log.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function getTaskFilterLabel(
  taskFilter: LogTaskFilter,
  tasks: WorkspaceWorkItem[],
) {
  if (taskFilter === "all") {
    return "All tasks";
  }

  if (taskFilter === "unassigned") {
    return "Unassigned";
  }

  return tasks.find((task) => task.id === taskFilter)?.title ?? "Task";
}

function parseTaskFilter(value: string | null): LogTaskFilter {
  if (!value || value === "all") {
    return "all";
  }

  return value;
}

function matchesLogTypeFilter(log: WorkspaceLogItem, type: LogListTypeFilter) {
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

function countLogsByType(logs: WorkspaceLogItem[], type: LogListTypeFilter) {
  return logs.filter((log) => matchesLogTypeFilter(log, type)).length;
}

function getTaskFiltersForLogs(
  tasks: WorkspaceWorkItem[],
  logs: WorkspaceLogItem[],
  type: LogListTypeFilter,
) {
  const taskIds = new Set(
    logs
      .filter((log) => matchesLogTypeFilter(log, type))
      .map((log) => log.taskId)
      .filter((taskId): taskId is string => Boolean(taskId)),
  );

  return tasks.filter((task) => taskIds.has(task.id));
}

function FilterDropdown({
  label,
  active,
  valueLabel,
  children,
}: {
  label: string;
  active?: boolean;
  valueLabel?: string;
  children: ReactNode | ((close: () => void) => ReactNode);
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12.5px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
          active
            ? "text-zinc-950"
            : "text-zinc-500 hover:text-zinc-950",
        )}
      >
        <span>{label}</span>
        {active && valueLabel ? (
          <span className="max-w-[120px] truncate text-zinc-400">
            : {valueLabel}
          </span>
        ) : null}
        <IconChevronDown
          className={cn(
            "size-3.5 shrink-0 text-zinc-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 min-w-[188px] max-w-[min(100vw-2rem,280px)] overflow-hidden rounded-lg border border-zinc-200/70 bg-white shadow-[0_4px_18px_rgba(24,24,27,0.08)]"
        >
          {typeof children === "function"
            ? children(() => setOpen(false))
            : children}
        </div>
      ) : null}
    </div>
  );
}

function FilterMenuItem({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/20",
        active
          ? "bg-zinc-50 font-medium text-zinc-950"
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950",
      )}
    >
      {children}
    </button>
  );
}

function LogListRow({
  log,
  task,
  selected,
  onToggle,
}: {
  log: WorkspaceLogItem;
  task?: WorkspaceWorkItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="border-t border-zinc-200/80 first:border-t-0">
      <div
        className={cn(
          "group rounded-lg px-2.5 py-2.5 transition",
          selected ? "bg-zinc-50" : "hover:bg-zinc-50",
        )}
      >
        <div className="grid grid-cols-[17px_minmax(0,1fr)_auto] items-center gap-x-2.5">
          <SelectionCheckbox
            checked={selected}
            label={`${selected ? "Deselect" : "Select"} ${log.title}`}
            onChange={onToggle}
          />
          <Link
            href={getLogHref(log.id)}
            className="min-w-0 truncate text-[14.5px] font-medium leading-5 text-zinc-950 transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            {log.title}
          </Link>
          <LogTypeLabel>{log.label}</LogTypeLabel>
        </div>
        {log.description ? (
          <p className="mt-1 line-clamp-2 pl-[calc(17px+0.625rem)] text-[12.5px] leading-5 text-zinc-500">
            {log.description}
          </p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-[calc(17px+0.625rem)] text-[12px] text-zinc-400">
          {task ? (
            <Link
              href={getTaskHref(task.id)}
              title={task.title}
              className="max-w-[min(100%,180px)] truncate font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              {task.title}
            </Link>
          ) : null}
          {log.branch ? (
            <code className="font-mono text-[11.5px] text-zinc-400">
              {log.branch}
            </code>
          ) : null}
          <span>{formatLogMeta(log.meta)}</span>
          {log.commit ? (
            <code className="font-mono text-[11.5px] text-zinc-400">
              {log.commit}
            </code>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function formatLogMeta(meta: string) {
  return meta.split(" · ")[0] ?? meta;
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
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
