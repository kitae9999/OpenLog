"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { MarkdownContent } from "@/shared/ui/markdown";
import { LogTypeLabel } from "./LogTypeLabel";
import {
  buildLogsListHref,
  countUnassignedLogs,
  getLogsForTask,
  getNewLogHref,
  getNewOutputHref,
  getOutputHref,
  getOutputsForTask,
  getSpawnedTodosForTask,
  getTabHref,
  getTaskBranches,
  getTaskEditHref,
  getTaskMeta,
  getLogHref,
  getTasksHref,
  type WorkspaceLogItem,
  type WorkspaceSpawnedTodo,
  type WorkspaceTodoItem,
  type WorkspaceWorkItem,
  type WorkspaceWorkStatus,
} from "./data";
import { saveTaskOverride } from "./taskOverrides";
import { updateWorkspaceTask } from "./workspaceActions";
import type { WorkspaceUiData } from "./workspaceTypes";

export function TaskDetailView({
  task,
  workspaceData,
  isLoggedIn = true,
}: {
  task: WorkspaceWorkItem;
  workspaceData?: WorkspaceUiData | null;
  isLoggedIn?: boolean;
}) {
  const router = useRouter();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<WorkspaceWorkStatus | null>(
    null,
  );

  const status = localStatus ?? task.status;
  const logs = workspaceData
    ? workspaceData.logs.filter((log) => log.taskId === task.id)
    : getLogsForTask(task.id);
  const outputs = workspaceData
    ? workspaceData.outputs.filter((output) => output.taskIds.includes(task.id))
    : getOutputsForTask(task.id);
  const branches = workspaceData
    ? getTaskBranchesFromLogs(logs)
    : getTaskBranches(task.id);
  const meta = workspaceData ? getApiTaskMeta(logs) : getTaskMeta(task.id);
  const spawnedTodos = workspaceData
    ? getApiSpawnedTodos(task.id, workspaceData.todos)
    : getSpawnedTodosForTask(task.id);
  const unassignedCount = workspaceData
    ? workspaceData.logs.filter((log) => !log.taskId).length
    : countUnassignedLogs();
  const statusLabel =
    status === "doing" ? "Open" : status === "done" ? "Done" : "Todo";
  const hasBody = task.body.trim().length > 0;
  const canMarkDone = status !== "done";

  async function markDone() {
    if (!canMarkDone || isUpdatingStatus) {
      return;
    }

    setIsUpdatingStatus(true);
    setStatusError(null);

    if (workspaceData) {
      const result = await updateWorkspaceTask({
        workspaceId: workspaceData.workspaceId,
        taskId: task.id,
        title: task.title,
        content: task.body,
        status: "DONE",
      });

      setIsUpdatingStatus(false);

      if (!result.ok) {
        setStatusError(result.message ?? "Failed to mark task as done.");
        return;
      }

      setLocalStatus("done");
      router.refresh();
      return;
    }

    saveTaskOverride(task.id, {
      title: task.title,
      body: task.body,
      status: "done",
    });
    setLocalStatus("done");
    setIsUpdatingStatus(false);
  }

  return (
    <div data-testid="task-detail-layout" className="pb-4">
      <Link
        href={getTasksHref()}
        className="inline-flex items-center gap-2 text-[13px] text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        <IconArrowLeft className="size-3.5" />
        Back to Tasks
      </Link>

      <header
        data-testid="task-title-block"
        className="mt-6 border-b border-zinc-200/80 pb-6"
      >
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <h1 className="max-w-[28ch] font-[family-name:var(--font-georgia,Georgia,serif)] text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-zinc-950 sm:max-w-[40ch] sm:text-[30px]">
            {task.title}
          </h1>
          <span className="font-mono text-[18px] tracking-tight text-zinc-400 sm:text-[20px]">
            #{task.id}
          </span>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[13px] text-zinc-500">
          <StatusBadge status={status} label={statusLabel} />
          <MetaSep />
          <span>
            <span className="font-semibold text-zinc-800">{logs.length}</span>{" "}
            linked logs
            {outputs.length > 0 ? (
              <>
                {" · "}
                <span className="font-semibold text-zinc-800">
                  {outputs.length}
                </span>{" "}
                outputs
              </>
            ) : null}
          </span>
          <MetaSep />
          <span>started {meta.startedLabel}</span>
          <MetaSep />
          <span>updated {meta.lastActivityLabel}</span>
        </div>

        {statusError ? (
          <p className="mt-3 text-[12px] text-red-600">{statusError}</p>
        ) : null}
      </header>

      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0 space-y-6">
          <section
            data-testid="task-description-block"
            className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(24,24,27,0.04)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-zinc-50/70 px-4 py-2.5">
              <span className="text-[13px] font-semibold text-zinc-900">
                Description
              </span>
              <Link
                href={getTaskEditHref(task.id)}
                className="rounded-md px-1.5 py-0.5 text-[12px] font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                Edit
              </Link>
            </div>
            <div className="px-5 py-5">
              {hasBody ? (
                <div className="max-w-[68ch]">
                  <MarkdownContent markdown={task.body} variant="dense" />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-5 py-9 text-center">
                  <p className="text-[14px] font-medium text-zinc-700">
                    No description yet.
                  </p>
                  <p className="mt-1.5 text-[13px] leading-5 text-zinc-500">
                    Add context, goals, and scope — like a PR description.
                  </p>
                  <div className="mt-4">
                    <LinkButton
                      href={getTaskEditHref(task.id)}
                      tone="outline"
                      size="sm"
                    >
                      Write description
                    </LinkButton>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section
            data-testid="task-logs-block"
            className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(24,24,27,0.04)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-zinc-50/70 px-4 py-2.5">
              <h2 className="flex items-baseline gap-2 text-[13px] font-semibold text-zinc-900">
                Linked logs
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-500">
                  {logs.length}
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-1">
                {unassignedCount > 0 ? (
                  <Link
                    href={buildLogsListHref("all", "unassigned")}
                    className="rounded-md px-2 py-1 text-[12px] font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
                  >
                    Unassigned ({unassignedCount})
                  </Link>
                ) : null}
                <Link
                  href={buildLogsListHref("all", "unassigned")}
                  className="rounded-md px-2 py-1 text-[12px] font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
                >
                  Link existing
                </Link>
              </div>
            </div>

            {logs.length === 0 ? (
              <p className="px-5 py-9 text-[13px] leading-5 text-zinc-500">
                No logs linked yet. Capture decisions and progress against this
                task.
              </p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {logs.map((log) => (
                  <TaskLogRow key={log.id} log={log} />
                ))}
              </div>
            )}

            <div className="border-t border-zinc-200/80 bg-zinc-50/50 px-4 py-2.5">
              <Link
                href={getNewLogHref(task.id)}
                className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                <span className="text-zinc-400" aria-hidden="true">
                  +
                </span>
                Log to this task
              </Link>
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-2.5 pt-1">
            <LinkButton href={getTaskEditHref(task.id)} tone="outline">
              Edit
            </LinkButton>
            {canMarkDone ? (
              <button
                type="button"
                onClick={markDone}
                disabled={isUpdatingStatus}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                {isUpdatingStatus ? "Updating..." : "Mark done"}
              </button>
            ) : (
              <LinkButton href={getNewOutputHref(task.id)} tone="solid">
                Create output
              </LinkButton>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <InfoCard title="Workspace">
            <Link
              href={getTabHref("workspace", isLoggedIn)}
              className="text-[13px] font-medium leading-6 text-zinc-800 underline-offset-4 transition hover:text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              openlog
            </Link>
            <p className="mt-2 text-[12px] text-zinc-500">
              Status{" "}
              <span className="font-semibold text-zinc-700">{statusLabel}</span>
            </p>
          </InfoCard>

          {branches.length > 0 ? (
            <InfoCard title="Branches">
              <ul className="space-y-2">
                {branches.map(({ branch, count }) => (
                  <li
                    key={branch}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <CodePill>{branch}</CodePill>
                    <span className="text-[11px] tabular-nums text-zinc-400">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] leading-4 text-zinc-400">
                From linked logs — not a task field.
              </p>
            </InfoCard>
          ) : null}

          {spawnedTodos.length > 0 ? (
            <InfoCard title="Spawned todos">
              <ul className="space-y-3">
                {spawnedTodos.map(({ todo, link }) => (
                  <li key={todo.id}>
                    <p className="text-[13px] leading-5 text-zinc-800">
                      {todo.title}
                    </p>
                    {link.dueLabel ? (
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        {link.dueLabel}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </InfoCard>
          ) : null}

          <InfoCard title="Outputs">
            {outputs.length === 0 ? (
              <p className="text-[13px] leading-5 text-zinc-500">
                {status === "done"
                  ? "No outputs yet."
                  : "Create when source logs are ready."}
              </p>
            ) : (
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
            )}
            {status === "done" ? (
              <Link
                href={getNewOutputHref(task.id)}
                className="mt-3 inline-flex text-[12px] font-semibold text-zinc-500 transition hover:text-zinc-950"
              >
                + New output
              </Link>
            ) : null}
          </InfoCard>
        </aside>
      </div>
    </div>
  );
}

function TaskLogRow({ log }: { log: WorkspaceLogItem }) {
  return (
    <Link
      href={getLogHref(log.id)}
      className="group flex items-start gap-3 px-4 py-3.5 transition hover:bg-zinc-50/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/20"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <LogTypeLabel>{log.label}</LogTypeLabel>
          <h3 className="text-[13.5px] font-semibold leading-snug text-zinc-950 group-hover:text-zinc-800">
            {log.title}
          </h3>
        </div>
        <p className="mt-1 line-clamp-1 text-[12.5px] leading-5 text-zinc-500">
          {log.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-400">
          <span>{formatLogMeta(log.meta)}</span>
          {log.branch ? <CodePill>{log.branch}</CodePill> : null}
          {log.commit ? <CodePill>{log.commit}</CodePill> : null}
        </div>
      </div>
      <IconArrowRight className="mt-0.5 size-3.5 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500" />
    </Link>
  );
}

function formatLogMeta(meta: string) {
  return meta.split(" · ")[0] ?? meta;
}

function getTaskBranchesFromLogs(logs: WorkspaceLogItem[]) {
  const counts = new Map<string, number>();

  for (const log of logs) {
    if (!log.branch) continue;
    counts.set(log.branch, (counts.get(log.branch) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([branch, count]) => ({ branch, count }))
    .sort((a, b) => b.count - a.count);
}

function getApiTaskMeta(logs: WorkspaceLogItem[]) {
  const latest = logs[0]?.meta.split(" · ")[0] ?? "-";

  return {
    startedLabel: logs.at(-1)?.meta.split(" · ")[0] ?? latest,
    lastActivityLabel: latest,
  };
}

function getApiSpawnedTodos(
  taskId: string,
  todos: WorkspaceTodoItem[],
): Array<{ todo: WorkspaceTodoItem; link: WorkspaceSpawnedTodo }> {
  return todos
    .filter((todo) => todo.taskId === taskId)
    .map((todo) => ({
      todo,
      link: { taskId, todoId: todo.id },
    }));
}

function MetaSep() {
  return (
    <span className="hidden text-zinc-300 sm:inline" aria-hidden="true">
      ·
    </span>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: WorkspaceWorkStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold tracking-wide text-white shadow-sm",
        status === "doing" && "bg-emerald-600",
        status === "done" && "bg-zinc-600",
        status === "todo" && "bg-zinc-500",
      )}
    >
      <span className="size-1.5 rounded-full bg-white/90" />
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
