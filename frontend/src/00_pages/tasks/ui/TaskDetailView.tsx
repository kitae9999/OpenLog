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
import { LogTypeLabel } from "@/entities/workspace/ui/LogTypeLabel";
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
  getTaskMeta,
  getLogHref,
  getTasksHref,
  type WorkspaceLogItem,
  type WorkspaceSpawnedTodo,
  type WorkspaceTodoItem,
  type WorkspaceWorkItem,
  type WorkspaceWorkStatus,
} from "@/entities/workspace/model/data";
import { saveTaskOverride } from "@/features/document-overrides/model/taskOverrides";
import {
  deleteWorkspaceTask,
  updateWorkspaceTask,
} from "@/features/workspace-actions/api/workspaceActions";
import type { WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

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
    status === "doing" ? "doing" : status === "done" ? "done" : "todo";
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
    <div
      data-testid="task-detail-layout"
      className="mx-auto w-full max-w-[920px] pb-4"
    >
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
        <Link
          href={getTasksHref()}
          className="font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          Tasks
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="max-w-[45vw] truncate font-semibold text-zinc-950">
          {task.title}
        </span>
      </nav>

      <header data-testid="task-title-block" className="pb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
                {task.title}
              </h1>
              <span className="font-mono text-[13px] text-zinc-400">
                #{task.id}
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-zinc-500">
              <span className="inline-flex items-center gap-1.5 font-medium text-zinc-600">
                <StatusDot status={status} />
                {statusLabel}
              </span>
              <MetaSep />
              <span>
                {logs.length} linked log{logs.length === 1 ? "" : "s"}
                {outputs.length > 0
                  ? ` · ${outputs.length} output${outputs.length === 1 ? "" : "s"}`
                  : ""}
              </span>
              <MetaSep />
              <span>started {meta.startedLabel}</span>
              <MetaSep />
              <span>updated {meta.lastActivityLabel}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {canMarkDone ? (
              <button
                type="button"
                onClick={markDone}
                disabled={isUpdatingStatus}
                className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
              >
                {isUpdatingStatus ? "Updating..." : "Mark done"}
              </button>
            ) : (
              <Link
                href={getNewOutputHref(task.id)}
                className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                + New output
              </Link>
            )}
          </div>
        </div>
        {statusError ? (
          <p className="mt-3 text-[12.5px] font-medium text-rose-600">
            {statusError}
          </p>
        ) : null}
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-12">
        <div className="min-w-0">
          <section data-testid="task-description-block">
            {isEditing ? (
              <div>
                <div
                  role="tablist"
                  aria-label="Description editor"
                  className="flex items-end gap-1 border-b border-zinc-200"
                >
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

                <div className="mt-3">
                  <MarkdownToolbar
                    disabled={mode === "preview"}
                    onAction={insertFormatting}
                  />
                </div>

                {mode === "write" ? (
                  <label className="mt-3 block">
                    <span className="sr-only">Task description</span>
                    <textarea
                      ref={editorRef}
                      value={draftBody}
                      onChange={(event) => setDraftBody(event.target.value)}
                      placeholder={`## Context\nWhy this task exists\n\n## Goal\nWhat done looks like\n\n## Scope\n- In\n- Out`}
                      className="openlog-scroll min-h-[320px] w-full resize-none overflow-y-auto border-0 bg-transparent py-2 font-mono text-[13.5px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400"
                    />
                  </label>
                ) : (
                  <div className="mt-3 min-h-[320px] py-2 text-[15px] leading-7 text-zinc-800">
                    <MarkdownContent
                      markdown={draftBody}
                      variant="dense"
                      emptyFallback={
                        <p className="text-zinc-400">Nothing to preview yet.</p>
                      }
                    />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-[12.5px] text-zinc-500">
                    {editError ?? "Markdown supported"}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveDescription}
                      disabled={isSaving}
                      className={cn(
                        "text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                        !isSaving
                          ? "text-zinc-950 hover:text-zinc-700"
                          : "cursor-not-allowed text-zinc-400",
                      )}
                    >
                      {isSaving ? "Updating..." : "Update"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
                    Description
                  </h2>
                  <button
                    type="button"
                    onClick={startEditing}
                    className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                  >
                    Edit
                  </button>
                </div>
                <div className="mt-4">
                  {hasBody ? (
                    <div className="max-w-[68ch]">
                      <MarkdownContent markdown={body} variant="dense" />
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-zinc-500">
                        No description yet. Add context, goals, and scope.
                      </p>
                      <button
                        type="button"
                        onClick={startEditing}
                        className="mt-3 text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                      >
                        + Write description
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <div
            className="my-8 h-px w-full bg-zinc-200"
            aria-hidden="true"
          />

          <section data-testid="task-logs-block">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
                Linked logs
                <span className="ml-2 tabular-nums text-zinc-400">
                  {logs.length}
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                {unassignedCount > 0 ? (
                  <Link
                    href={buildLogsListHref("all", "unassigned")}
                    className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                  >
                    Unassigned ({unassignedCount})
                  </Link>
                ) : null}
                <Link
                  href={buildLogsListHref("all", "unassigned")}
                  className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                >
                  Link existing
                </Link>
              </div>
            </div>

            {logs.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">
                No logs linked yet. Capture decisions and progress against this
                task.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-zinc-200/80">
                {logs.map((log) => (
                  <li key={log.id}>
                    <TaskLogRow log={log} />
                  </li>
                ))}
              </ul>
            )}

            <Link
              href={getNewLogHref(task.id)}
              className="mt-3 inline-flex text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              + Log to this task
            </Link>
          </section>

          {workspaceData ? (
            <>
              <div
                className="my-8 h-px w-full bg-zinc-200"
                aria-hidden="true"
              />
              <div>
              {deleteError ? (
                <p className="mb-3 text-[12.5px] font-medium text-rose-600">
                  {deleteError}
                </p>
              ) : null}
              <button
                type="button"
                onClick={deleteTask}
                disabled={isDeleting}
                className="text-[13px] font-medium text-rose-600 transition hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete task"}
              </button>
              </div>
            </>
          ) : null}
        </div>

        <aside className="space-y-6 border-t border-zinc-200/80 pt-6 lg:sticky lg:top-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          <SidebarField label="Status">
            <p className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-zinc-950">
              <StatusDot status={status} />
              {statusLabel}
            </p>
          </SidebarField>

          <SidebarField label="Started">
            <p className="text-[13.5px] font-medium text-zinc-950">
              {meta.startedLabel}
            </p>
          </SidebarField>

          <SidebarField label="Updated">
            <p className="text-[13.5px] font-medium text-zinc-950">
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
                    <code className="font-mono text-[12px] text-zinc-600">
                      {branch}
                    </code>
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
                      className="text-[13px] font-medium leading-5 text-zinc-800 transition hover:text-zinc-950"
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
                className="mt-2 inline-flex text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950"
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
      className="group block rounded-lg px-2.5 py-2.5 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <LogTypeLabel>{log.label}</LogTypeLabel>
        <span className="min-w-0 truncate text-[14.5px] font-medium text-zinc-950 group-hover:text-zinc-700">
          {log.title}
        </span>
      </div>
      {log.description ? (
        <p className="mt-1 line-clamp-1 text-[12.5px] leading-5 text-zinc-500">
          {log.description}
        </p>
      ) : null}
      <p className="mt-1.5 text-[12px] text-zinc-400">
        {formatLogMeta(log.meta)}
        {log.branch ? (
          <>
            {" · "}
            <span className="font-mono">{log.branch}</span>
          </>
        ) : null}
        {log.commit ? (
          <>
            {" · "}
            <span className="font-mono">{log.commit}</span>
          </>
        ) : null}
      </p>
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
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative h-9 px-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        active ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-800",
      )}
    >
      {children}
      {active ? (
        <span className="absolute inset-x-2 -bottom-px h-0.5 bg-zinc-950" />
      ) : null}
    </button>
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

function SidebarField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[12px] font-medium text-zinc-400">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
