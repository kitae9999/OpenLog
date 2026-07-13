"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import {
  formatSelection,
  getImageFallbackText,
  type ToolbarAction,
  type ToolbarActionPayload,
} from "@/shared/lib/markdown";
import { MarkdownContent, MarkdownToolbar } from "@/shared/ui/markdown";
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
  getTaskBranches,
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
import {
  deleteWorkspaceTask,
  updateWorkspaceTask,
} from "./workspaceActions";
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
  const [localBody, setLocalBody] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftBody, setDraftBody] = useState(task.body);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const status = localStatus ?? task.status;
  const body = localBody ?? task.body;
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
  const hasBody = body.trim().length > 0;
  const canMarkDone = status !== "done";

  function startEditing() {
    setDraftBody(body);
    setMode("write");
    setEditError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftBody(body);
    setMode("write");
    setEditError(null);
    setIsEditing(false);
  }

  function insertFormatting(
    action: ToolbarAction,
    payload?: ToolbarActionPayload,
  ) {
    const textarea = editorRef.current;
    if (!textarea) {
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectedText = draftBody.slice(selectionStart, selectionEnd);
    const { nextValue, nextSelectionStart, nextSelectionEnd } = formatSelection(
      action,
      draftBody,
      selectedText,
      selectionStart,
      selectionEnd,
      { fallbackText: getImageFallbackText(payload) },
    );

    setDraftBody(nextValue);

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    });
  }

  async function saveDescription() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setEditError(null);

    if (workspaceData) {
      const result = await updateWorkspaceTask({
        workspaceId: workspaceData.workspaceId,
        taskId: task.id,
        title: task.title,
        description: task.description ?? null,
        content: draftBody,
        status: task.apiStatus ?? toApiTaskStatus(status),
      });

      setIsSaving(false);

      if (!result.ok) {
        setEditError(result.message ?? "Failed to save description.");
        return;
      }

      setLocalBody(draftBody);
      setIsEditing(false);
      setMode("write");
      router.refresh();
      return;
    }

    saveTaskOverride(task.id, {
      title: task.title,
      body: draftBody,
      status,
    });
    setLocalBody(draftBody);
    setIsEditing(false);
    setMode("write");
    setIsSaving(false);
    router.refresh();
  }

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
        content: body,
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
      body,
      status: "done",
    });
    setLocalStatus("done");
    setIsUpdatingStatus(false);
  }

  async function deleteTask() {
    if (!workspaceData || isDeleting) {
      return;
    }

    if (!window.confirm("Delete this task? Linked records will be kept.")) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteWorkspaceTask({
      workspaceId: workspaceData.workspaceId,
      taskId: task.id,
    });

    if (!result.ok) {
      setDeleteError(result.message ?? "Failed to delete task.");
      setIsDeleting(false);
      return;
    }

    router.push(result.href ?? getTasksHref());
    router.refresh();
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
          <h1 className="max-w-[28ch] text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-zinc-950 sm:max-w-[40ch] sm:text-[30px]">
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
            {isEditing ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-zinc-50/70 px-4">
                  <div className="flex items-center gap-4">
                    <TabButton
                      active={mode === "write"}
                      onClick={() => setMode("write")}
                    >
                      Write
                    </TabButton>
                    <TabButton
                      active={mode === "preview"}
                      onClick={() => setMode("preview")}
                    >
                      Preview
                    </TabButton>
                  </div>
                </div>

                <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-2">
                  <MarkdownToolbar
                    disabled={mode === "preview"}
                    onAction={insertFormatting}
                  />
                </div>

                {mode === "write" ? (
                  <label className="block">
                    <span className="sr-only">Task description</span>
                    <textarea
                      ref={editorRef}
                      value={draftBody}
                      onChange={(event) => setDraftBody(event.target.value)}
                      placeholder={`## Context\nWhy this task exists\n\n## Goal\nWhat done looks like\n\n## Scope\n- In\n- Out`}
                      className="min-h-[320px] w-full resize-y border-0 bg-white px-5 py-5 font-mono text-[13.5px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400"
                    />
                  </label>
                ) : (
                  <div className="min-h-[320px] px-5 py-5 text-[15px] leading-7 text-zinc-800">
                    <MarkdownContent
                      markdown={draftBody}
                      variant="dense"
                      emptyFallback={
                        <p className="text-zinc-400">Nothing to preview yet.</p>
                      }
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3">
                  <span className="text-[12px] text-zinc-500">
                    {editError ?? "Markdown supported"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="inline-flex h-8 items-center rounded-lg px-3 text-[12.5px] font-semibold text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveDescription}
                      disabled={isSaving}
                      className={cn(
                        "inline-flex h-8 items-center rounded-lg px-3 text-[12.5px] font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                        !isSaving
                          ? "bg-zinc-950 hover:bg-zinc-800"
                          : "cursor-not-allowed bg-zinc-400",
                      )}
                    >
                      {isSaving ? "Updating..." : "Update"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-zinc-50/70 px-4 py-2.5">
                  <span className="text-[13px] font-semibold text-zinc-900">
                    Description
                  </span>
                  <button
                    type="button"
                    onClick={startEditing}
                    className="rounded-md px-1.5 py-0.5 text-[12px] font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                  >
                    Edit
                  </button>
                </div>
                <div className="px-5 py-5">
                  {hasBody ? (
                    <div className="max-w-[68ch]">
                      <MarkdownContent markdown={body} variant="dense" />
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
                        <button
                          type="button"
                          onClick={startEditing}
                          className="inline-flex h-8 items-center justify-center rounded-[10px] border border-zinc-300 bg-white px-3 text-[12.5px] font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                        >
                          Write description
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
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

            <div className="border-t border-zinc-200/80 bg-white px-4 py-2.5">
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
            {deleteError ? (
              <p className="w-full text-right text-[12px] text-red-600">
                {deleteError}
              </p>
            ) : null}
            {workspaceData ? (
              <button
                type="button"
                onClick={deleteTask}
                disabled={isDeleting}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-[13px] font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete task"}
              </button>
            ) : null}
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

        <aside className="space-y-5 px-1 lg:sticky lg:top-6 lg:px-0">
          <SidebarField label="Status">
            <p className="text-[13.5px] font-medium text-zinc-900">{statusLabel}</p>
          </SidebarField>

          <SidebarField label="Started">
            <p className="text-[13.5px] font-medium text-zinc-900">
              {meta.startedLabel}
            </p>
          </SidebarField>

          <SidebarField label="Updated">
            <p className="text-[13.5px] font-medium text-zinc-900">
              {meta.lastActivityLabel}
            </p>
          </SidebarField>

          {branches.length > 0 ? (
            <SidebarField label="Branches">
              <ul className="mt-0.5 space-y-1.5">
                {branches.map(({ branch, count }) => (
                  <li
                    key={branch}
                    className="flex items-center justify-between gap-2"
                  >
                    <CodePill>{branch}</CodePill>
                    <span className="text-[11px] tabular-nums text-zinc-400">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            </SidebarField>
          ) : null}

          {spawnedTodos.length > 0 ? (
            <SidebarField label="Todos">
              <ul className="mt-0.5 space-y-2">
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
            </SidebarField>
          ) : null}

          <SidebarField label="Outputs">
            {outputs.length === 0 ? (
              <p className="text-[12.5px] leading-5 text-zinc-500">
                {status === "done"
                  ? "No outputs yet."
                  : "Create when source logs are ready."}
              </p>
            ) : (
              <ul className="mt-0.5 space-y-1.5">
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
                className="mt-2 inline-flex text-[12px] font-semibold text-zinc-500 transition hover:text-zinc-950"
              >
                + New output
              </Link>
            ) : null}
          </SidebarField>
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

function toApiTaskStatus(status: WorkspaceWorkStatus) {
  switch (status) {
    case "done":
      return "DONE" as const;
    case "doing":
      return "DOING" as const;
    default:
      return "TODO" as const;
  }
}

function TabButton({
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
        "relative h-11 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        active
          ? "font-semibold text-zinc-950"
          : "font-medium text-zinc-500 hover:text-zinc-950",
      )}
    >
      {children}
      {active ? (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-zinc-950" />
      ) : null}
    </button>
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

function SidebarField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-zinc-400">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
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
