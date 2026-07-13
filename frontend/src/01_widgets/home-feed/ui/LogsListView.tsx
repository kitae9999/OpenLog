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
import { LogTypeLabel } from "./LogTypeLabel";
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
} from "./data";
import { mergeLogWithOverrides } from "./logOverrides";
import {
  DocumentBulkBar,
  SelectionCheckbox,
  useDocumentSelection,
} from "./DocumentBulkSelection";
import { deleteWorkspaceDocuments } from "./workspaceActions";
import type { WorkspaceUiData } from "./workspaceTypes";

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
  const searchParams = useSearchParams();
  const tasks = workspaceData?.tasks ?? [];
  const logs = useMemo(
    () => {
      const initialLogs = workspaceData?.logs ?? [];
      return workspaceData
        ? initialLogs
        : initialLogs.map((log) => mergeLogWithOverrides(log));
    },
    [workspaceData],
  );
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
    router.refresh();
    return true;
  }

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
        <span className="font-semibold text-zinc-950">{title}</span>
      </nav>

      <article className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
        <header className="border-b border-zinc-100 px-6 pb-2.5 pt-[22px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-[family-name:var(--font-georgia,Georgia,serif)] text-2xl font-bold tracking-[-0.01em] text-zinc-950">
                {title}
              </h1>
              <p className="mt-1.5 text-[13px] text-zinc-500">
                <span className="font-semibold text-zinc-700 tabular-nums">
                  {filteredLogs.length}
                </span>{" "}
                log{filteredLogs.length === 1 ? "" : "s"}
              </p>
            </div>
            <LinkButton href={getNewLogHref()} tone="solid" size="sm">
              + New log
            </LinkButton>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {logsSubnavItems.map((item) => (
                <FilterChip
                  key={item.key}
                  active={typeFilter === item.key}
                  onClick={() => setTypeFilter(item.key)}
                >
                  {item.label}
                  <span
                    className={cn(
                      "tabular-nums",
                      typeFilter === item.key
                        ? "text-white/70"
                        : "text-zinc-400",
                    )}
                  >
                    {countLogsByType(logs, item.key)}
                  </span>
                </FilterChip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-0.5">
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
                    {(unassignedForType > 0 ||
                      taskFilter === "unassigned") && (
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
        </header>

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

        <div className="px-[18px] pb-2 pt-1">
          {filteredLogs.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-zinc-500">
              No logs match this view.
            </p>
          ) : (
            filteredLogs.map((log) => (
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
            ))
          )}
        </div>
      </article>
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
          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
          active
            ? "bg-zinc-100 text-zinc-950"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
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
          className="absolute right-0 z-20 mt-1 min-w-[200px] max-w-[min(100vw-2rem,280px)] overflow-hidden rounded-xl border border-zinc-200/70 bg-white py-1 shadow-[0_12px_40px_rgba(24,24,27,0.12)]"
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
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
        "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/20",
        active
          ? "bg-zinc-50 font-semibold text-zinc-950"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950",
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
    <article
      className="flex items-start gap-3 border-t border-zinc-100 py-3.5 first:border-t-0"
    >
      <SelectionCheckbox
        checked={selected}
        label={`${selected ? "Deselect" : "Select"} ${log.title}`}
        onChange={onToggle}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[15px] font-semibold leading-snug text-zinc-950">
            <Link
              href={getLogHref(log.id)}
              className="transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              {log.title}
            </Link>
          </h2>
        </div>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-5 text-zinc-500">
          {log.description}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-zinc-400">
          <LogTypeLabel>{log.label}</LogTypeLabel>
          {task ? <TaskLink label={task.title} href={getTaskHref(task.id)} /> : null}
          {log.branch ? <CodePill>{log.branch}</CodePill> : null}
          <span>{formatLogMeta(log.meta)}</span>
          {log.commit ? <CodePill>{log.commit}</CodePill> : null}
        </div>
      </div>
      <Link
        href={getLogHref(log.id)}
        aria-label={`Open ${log.title}`}
        className="shrink-0 self-center text-zinc-400 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <IconArrowRight className="size-4" />
      </Link>
    </article>
  );
}

function formatLogMeta(meta: string) {
  return meta.split(" · ")[0] ?? meta;
}

function TaskLink({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      title={label}
      className="inline-flex max-w-[min(100%,180px)] items-center truncate rounded-md bg-zinc-100 px-[7px] py-0.5 text-[10.5px] font-semibold text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
    >
      {label}
    </Link>
  );
}

function CodePill({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-zinc-100 px-[7px] py-0.5 font-mono text-[10.5px] text-zinc-500">
      {children}
    </code>
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
