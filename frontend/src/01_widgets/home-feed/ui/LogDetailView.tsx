"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/shared/lib/cn";
import { MarkdownContent } from "@/shared/ui/markdown";
import {
  getLogBody,
  getLogEditHref,
  getLogRecipe,
  getLogsHref,
  getOutputHref,
  getTaskById,
  getTaskHref,
  workspaceTaskOutputs,
  workspaceWorkItems,
  type WorkspaceLogItem,
  type WorkspaceTaskOutput,
  type WorkspaceWorkItem,
} from "./data";
import { saveLogOverride } from "./logOverrides";
import { updateWorkspaceLog } from "./workspaceActions";
import type { WorkspaceUiData } from "./workspaceTypes";

export function LogDetailView({
  log,
  workspaceData,
}: {
  log: WorkspaceLogItem;
  workspaceData?: WorkspaceUiData | null;
  isLoggedIn?: boolean;
}) {
  const router = useRouter();
  const [assignedTaskId, setAssignedTaskId] = useState<string | null>(
    log.taskId ?? null,
  );
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const recipe = getLogRecipe(log.id);
  const body = getLogBody(log);
  const tasks = workspaceData?.tasks ?? workspaceWorkItems;
  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== "done"),
    [tasks],
  );
  const task = assignedTaskId
    ? (tasks.find((item) => item.id === assignedTaskId) ??
      getTaskById(assignedTaskId))
    : undefined;
  const outputs = getOutputsForLog(
    log.id,
    workspaceData?.outputs ?? workspaceTaskOutputs,
  );
  const hasBody = body.trim().length > 0;
  const metaLabel = log.meta.split(" · ")[0] ?? log.meta;
  const typeLabel = log.label;
  const statusLabel =
    log.status === "OPEN"
      ? "Open"
      : log.status === "CLOSED"
        ? "Closed"
        : null;

  async function assignTask(nextTaskId: string | null) {
    if (isAssigning || nextTaskId === assignedTaskId) {
      return;
    }

    setIsAssigning(true);
    setAssignError(null);

    if (workspaceData) {
      const result = await updateWorkspaceLog({
        workspaceId: workspaceData.workspaceId,
        logId: log.id,
        title: log.title,
        content: getLogBody(log),
        summary: log.summary ?? log.description,
        taskId: nextTaskId,
        status: log.status ?? "NONE",
      });

      setIsAssigning(false);

      if (!result.ok) {
        setAssignError(result.message ?? "Failed to update task link.");
        return;
      }

      setAssignedTaskId(nextTaskId);
      router.refresh();
      return;
    }

    saveLogOverride(log.id, {
      title: log.title,
      body: log.body ?? getLogBody(log),
      taskId: nextTaskId,
    });
    setAssignedTaskId(nextTaskId);
    setIsAssigning(false);
  }

  return (
    <div data-testid="log-detail-layout" className="pb-4">
      <Link
        href={getLogsHref()}
        className="inline-flex items-center gap-2 text-[13px] text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <IconArrowLeft className="size-3.5" />
        Back to Logs
      </Link>

      <header
        data-testid="log-title-block"
        className="mt-6 border-b border-zinc-200/80 pb-6"
      >
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <h1 className="max-w-[28ch] font-[family-name:var(--font-georgia,Georgia,serif)] text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-zinc-950 sm:max-w-[40ch] sm:text-[30px]">
            {log.title}
          </h1>
          <span className="font-mono text-[18px] tracking-tight text-zinc-400 sm:text-[20px]">
            #{log.id}
          </span>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[13px] text-zinc-500">
          {statusLabel ? (
            <StatusBadge
              tone={log.status === "OPEN" ? "open" : "closed"}
              label={statusLabel}
            />
          ) : (
            <TypeBadge label={typeLabel} />
          )}
          {statusLabel ? (
            <>
              <MetaSep />
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                {typeLabel}
              </span>
            </>
          ) : null}
          {log.branch ? (
            <>
              <MetaSep />
              <CodePill>{log.branch}</CodePill>
            </>
          ) : null}
          <MetaSep />
          <span>{metaLabel}</span>
          {task ? (
            <>
              <MetaSep />
              <span>
                on{" "}
                <Link
                  href={getTaskHref(task.id)}
                  className="font-semibold text-zinc-800 underline-offset-2 transition hover:text-zinc-950 hover:underline"
                >
                  {task.title}
                </Link>
              </span>
            </>
          ) : (
            <>
              <MetaSep />
              <span className="font-medium text-zinc-600">Unassigned</span>
            </>
          )}
        </div>
      </header>

      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0 space-y-6">
          <section
            data-testid="log-content-block"
            className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(24,24,27,0.04)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-zinc-50/70 px-4 py-2.5">
              <span className="text-[13px] font-semibold text-zinc-900">
                Content
              </span>
              <Link
                href={getLogEditHref(log.id)}
                className="rounded-md px-1.5 py-0.5 text-[12px] font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                Edit
              </Link>
            </div>
            <div className="px-5 py-5">
              {hasBody ? (
                <div className="max-w-[68ch]">
                  <MarkdownContent markdown={body} variant="dense" />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-5 py-9 text-center">
                  <p className="text-[14px] font-medium text-zinc-700">
                    No log content yet.
                  </p>
                  <p className="mt-1.5 text-[13px] leading-5 text-zinc-500">
                    Write the recipe in markdown — problem, cause, fix,
                    verification.
                  </p>
                  <div className="mt-4">
                    <LinkButton
                      href={getLogEditHref(log.id)}
                      tone="outline"
                      size="sm"
                    >
                      Write log content
                    </LinkButton>
                  </div>
                </div>
              )}
            </div>
          </section>

          {log.commit ? (
            <section
              data-testid="log-commit-block"
              className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(24,24,27,0.04)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-zinc-50/70 px-4 py-2.5">
                <h2 className="flex items-center gap-2 text-[13px] font-semibold text-zinc-900">
                  Related commit
                </h2>
              </div>
              <div className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <CodePill>{log.commit}</CodePill>
                  {recipe?.commitMessage ? (
                    <span className="text-[13px] text-zinc-600">
                      {recipe.commitMessage}
                    </span>
                  ) : null}
                </div>
                {log.branch ? (
                  <p className="mt-2 text-[12px] text-zinc-400">
                    Captured on <CodePill>{log.branch}</CodePill>
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2.5 pt-1">
            <LinkButton href={getLogEditHref(log.id)} tone="outline">
              Edit
            </LinkButton>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-zinc-950 px-4 text-[13px] font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              Send to memory
            </button>
          </div>
        </div>

        <aside className="space-y-4">
          <InfoCard title="Task">
            <TaskSwitcher
              selected={task}
              openTasks={openTasks}
              disabled={isAssigning}
              onSelect={assignTask}
            />
            {task ? (
              <Link
                href={getTaskHref(task.id)}
                className="mt-2.5 inline-flex text-[12px] font-semibold text-zinc-500 transition hover:text-zinc-950"
              >
                Open task
              </Link>
            ) : null}
            {assignError ? (
              <p className="mt-2 text-[12px] text-red-600">{assignError}</p>
            ) : null}
          </InfoCard>

          {(log.branch || recipe?.source || recipe?.visibility) && (
            <InfoCard title="Capture">
              <dl className="space-y-2.5 text-[13px]">
                {log.branch ? (
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      Branch
                    </dt>
                    <dd className="mt-1">
                      <CodePill>{log.branch}</CodePill>
                    </dd>
                  </div>
                ) : null}
                {recipe?.source ? (
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      Source
                    </dt>
                    <dd className="mt-1 text-zinc-700">{recipe.source}</dd>
                  </div>
                ) : null}
                {recipe?.visibility ? (
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      Visibility
                    </dt>
                    <dd className="mt-1 font-medium text-zinc-700">
                      {recipe.visibility}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </InfoCard>
          )}

          {outputs.length > 0 ? (
            <InfoCard title="Outputs">
              <ul className="space-y-2.5">
                {outputs.map((output) => (
                  <li key={output.id}>
                    <Link
                      href={getOutputHref(output.id)}
                      className="text-[13px] font-medium leading-5 text-zinc-800 transition hover:text-zinc-950 hover:underline"
                    >
                      {output.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </InfoCard>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function TaskSwitcher({
  selected,
  openTasks,
  disabled,
  onSelect,
}: {
  selected?: WorkspaceWorkItem;
  openTasks: WorkspaceWorkItem[];
  disabled?: boolean;
  onSelect: (taskId: string | null) => void;
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

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative" data-testid="task-switcher">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-start justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold leading-5 text-zinc-900">
            {selected ? selected.title : "Unassigned"}
          </span>
          <span className="mt-0.5 block text-[11px] text-zinc-400">
            {selected
              ? selected.status
              : "Choose an open task"}
          </span>
        </span>
        <IconChevronDown
          className={cn(
            "mt-1 size-3.5 shrink-0 text-zinc-400 transition",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1.5 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.12)]"
        >
          <button
            type="button"
            role="option"
            aria-selected={!selected}
            onClick={() => {
              setOpen(false);
              onSelect(null);
            }}
            className={cn(
              "flex w-full items-center px-3 py-2.5 text-left text-[13px] transition hover:bg-zinc-50",
              !selected
                ? "font-semibold text-zinc-950"
                : "text-zinc-600",
            )}
          >
            Unassigned
          </button>
          <div className="max-h-56 overflow-y-auto border-t border-zinc-100">
            {openTasks.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-zinc-400">
                No open tasks.
              </p>
            ) : (
              openTasks.map((item) => {
                const isSelected = selected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setOpen(false);
                      onSelect(item.id);
                    }}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition hover:bg-zinc-50",
                      isSelected && "bg-zinc-50",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[13px] leading-5",
                        isSelected
                          ? "font-semibold text-zinc-950"
                          : "font-medium text-zinc-800",
                      )}
                    >
                      {item.title}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {item.status}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getOutputsForLog(
  logId: string,
  outputs: WorkspaceTaskOutput[],
): WorkspaceTaskOutput[] {
  return outputs.filter((output) => output.logIds.includes(logId));
}

function MetaSep() {
  return (
    <span className="hidden text-zinc-300 sm:inline" aria-hidden="true">
      ·
    </span>
  );
}

function StatusBadge({
  tone,
  label,
}: {
  tone: "open" | "closed";
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold tracking-wide text-white shadow-sm",
        tone === "open" ? "bg-emerald-600" : "bg-zinc-600",
      )}
    >
      <span className="size-1.5 rounded-full bg-white/90" />
      {label}
    </span>
  );
}

function TypeBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-zinc-100 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-600">
      {label}
    </span>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white px-3.5 py-3.5 shadow-[0_1px_2px_rgba(24,24,27,0.04)]">
      <h2 className="border-b border-zinc-100 pb-2.5 text-[12px] font-bold tracking-wide text-zinc-950">
        {title}
      </h2>
      <div className="pt-2.5">{children}</div>
    </section>
  );
}

function CodePill({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border border-zinc-200/80 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10.5px] text-zinc-500">
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
          ? "h-8 rounded-[10px] px-3 text-[12.5px]"
          : "h-9 rounded-xl px-4 text-[13px]",
        tone === "solid" && "bg-zinc-950 text-white hover:bg-zinc-800",
        tone === "outline" &&
          "border border-zinc-300 bg-white font-medium text-zinc-700 hover:bg-zinc-50",
        tone === "ghost" && "text-zinc-500 hover:text-zinc-950",
      )}
    >
      {children}
    </Link>
  );
}

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M19 12H5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
