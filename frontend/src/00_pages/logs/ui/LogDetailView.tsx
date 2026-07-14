"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import {
  formatSelection,
  getImageFallbackText,
  type ToolbarAction,
  type ToolbarActionPayload,
} from "@/shared/lib/markdown";
import { MarkdownContent, MarkdownToolbar } from "@/shared/ui/markdown";
import {
  getLogBody,
  getLogRecipe,
  getLogsHref,
  getOutputHref,
  getTabHref,
  getTaskById,
  getTaskHref,
  type WorkspaceLogItem,
  type WorkspaceTaskOutput,
  type WorkspaceWorkItem,
} from "@/entities/workspace/model/data";
import { saveLogOverride } from "@/features/document-overrides/model/logOverrides";
import {
  createWorkspaceMemoryFromLog,
  deleteWorkspaceLog,
  updateWorkspaceLog,
  type WorkspaceActionResult,
} from "@/features/workspace-actions/api/workspaceActions";
import type { WorkspaceUiData } from "@/entities/workspace/model/workspaceTypes";

export function LogDetailView({
  log,
  workspaceData,
  isLoggedIn = true,
  assignTaskOverride,
}: {
  log: WorkspaceLogItem;
  workspaceData?: WorkspaceUiData | null;
  isLoggedIn?: boolean;
  assignTaskOverride?: (
    taskId: string | null,
  ) => Promise<WorkspaceActionResult>;
}) {
  const router = useRouter();
  const [assignedTaskId, setAssignedTaskId] = useState<string | null>(
    log.taskId ?? null,
  );
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const initialBody = getLogBody(log);
  const [localBody, setLocalBody] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftBody, setDraftBody] = useState(initialBody);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSendingToMemory, setIsSendingToMemory] = useState(false);
  const [memoryError, setMemoryError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const recipe = getLogRecipe(log.id);
  const body = localBody ?? initialBody;
  const tasks = workspaceData?.tasks ?? [];
  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== "done"),
    [tasks],
  );
  const task = assignedTaskId
    ? (tasks.find((item) => item.id === assignedTaskId) ??
      getTaskById(assignedTaskId))
    : undefined;
  const outputs = getOutputsForLog(log.id, workspaceData?.outputs ?? []);
  const hasBody = body.trim().length > 0;
  const metaLabel = log.meta.split(" · ")[0] ?? log.meta;
  const typeLabel = log.label;
  const statusLabel =
    log.status === "OPEN" ? "Open" : log.status === "CLOSED" ? "Closed" : null;
  const existingMemory = workspaceData?.memories.find(
    (memory) => memory.originLog?.id === log.id,
  );

  async function sendToMemory() {
    if (existingMemory) {
      router.push(`/memory/${existingMemory.id}`);
      return;
    }
    if (!workspaceData || isSendingToMemory) return;
    setIsSendingToMemory(true);
    setMemoryError(null);
    const result = await createWorkspaceMemoryFromLog({
      workspaceId: workspaceData.workspaceId,
      logId: log.id,
    });
    if (!result.ok || !result.href) {
      setMemoryError(result.message ?? "Failed to send log to memory.");
      setIsSendingToMemory(false);
      return;
    }
    router.push(result.href);
    router.refresh();
  }

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

  async function saveContent() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setEditError(null);

    if (workspaceData) {
      const result = await updateWorkspaceLog({
        workspaceId: workspaceData.workspaceId,
        logId: log.id,
        title: log.title,
        content: draftBody,
        summary: log.summary ?? log.description,
        taskId: assignedTaskId,
        status: log.status ?? "NONE",
      });

      setIsSaving(false);

      if (!result.ok) {
        setEditError(result.message ?? "Failed to save content.");
        return;
      }

      setLocalBody(draftBody);
      setIsEditing(false);
      setMode("write");
      router.refresh();
      return;
    }

    saveLogOverride(log.id, {
      title: log.title,
      body: draftBody,
      taskId: assignedTaskId,
    });
    setLocalBody(draftBody);
    setIsEditing(false);
    setMode("write");
    setIsSaving(false);
    router.refresh();
  }

  async function assignTask(nextTaskId: string | null) {
    if (isAssigning || nextTaskId === assignedTaskId) {
      return;
    }

    setIsAssigning(true);
    setAssignError(null);

    if (workspaceData || assignTaskOverride) {
      const result = assignTaskOverride
        ? await assignTaskOverride(nextTaskId)
        : await updateWorkspaceLog({
            workspaceId: workspaceData!.workspaceId,
            logId: log.id,
            title: log.title,
            content: body,
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
      body,
      taskId: nextTaskId,
    });
    setAssignedTaskId(nextTaskId);
    setIsAssigning(false);
  }

  async function deleteLog() {
    if (!workspaceData || isDeleting) {
      return;
    }

    if (!window.confirm("Delete this log? Its memory will be kept.")) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteWorkspaceLog({
      workspaceId: workspaceData.workspaceId,
      logId: log.id,
    });

    if (!result.ok) {
      setDeleteError(result.message ?? "Failed to delete log.");
      setIsDeleting(false);
      return;
    }

    router.push(result.href ?? getLogsHref());
    router.refresh();
  }

  return (
    <div
      data-testid="log-detail-layout"
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
          href={getLogsHref()}
          className="font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          Logs
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="max-w-[45vw] truncate font-semibold text-zinc-950">
          {log.title}
        </span>
      </nav>

      <header data-testid="log-title-block" className="pb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
                {log.title}
              </h1>
              <span className="font-mono text-[13px] text-zinc-400">
                #{log.id}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-zinc-500">
              {statusLabel ? (
                <>
                  <span className="font-medium text-zinc-600">
                    {statusLabel}
                  </span>
                  <MetaSep />
                  <span>{typeLabel}</span>
                </>
              ) : (
                <span className="font-medium text-zinc-600">{typeLabel}</span>
              )}
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
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={sendToMemory}
              disabled={!workspaceData || isSendingToMemory}
              className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              {isSendingToMemory
                ? "Saving..."
                : existingMemory
                  ? "Open memory"
                  : "Send to memory"}
            </button>
          </div>
        </div>
        {memoryError ? (
          <p className="mt-3 text-[12.5px] font-medium text-rose-600">
            {memoryError}
          </p>
        ) : null}
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-12">
        <div className="min-w-0">
          <section data-testid="log-content-block">
            {isEditing ? (
              <div>
                <div
                  role="tablist"
                  aria-label="Log content editor"
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
                    <span className="sr-only">Log content</span>
                    <textarea
                      ref={editorRef}
                      value={draftBody}
                      onChange={(event) => setDraftBody(event.target.value)}
                      placeholder={`## Problem\nWhat went wrong\n\n## Cause\nWhy it happened\n\n## Fix\nWhat changed\n\n## Verification\nHow you confirmed`}
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
                      onClick={saveContent}
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
                    Content
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
                        No log content yet. Write the recipe in markdown —
                        problem, cause, fix, verification.
                      </p>
                      <button
                        type="button"
                        onClick={startEditing}
                        className="mt-3 text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                      >
                        + Write log content
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {log.commit ? (
            <>
              <div
                className="my-8 h-px w-full bg-zinc-200"
                aria-hidden="true"
              />
              <section data-testid="log-commit-block">
                <h2 className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
                  Related commit
                </h2>
                <div className="mt-4">
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
            </>
          ) : null}

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
                  onClick={deleteLog}
                  disabled={isDeleting}
                  className="text-[13px] font-medium text-rose-600 transition hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? "Deleting..." : "Delete log"}
                </button>
              </div>
            </>
          ) : null}
        </div>

        <aside className="space-y-6 border-t border-zinc-200/80 pt-6 lg:sticky lg:top-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          <SidebarField label="Task">
            <TaskSwitcher
              selected={task}
              openTasks={openTasks}
              disabled={isAssigning}
              onSelect={assignTask}
            />
            {task ? (
              <Link
                href={getTaskHref(task.id)}
                className="mt-2 inline-flex text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950"
              >
                Open task →
              </Link>
            ) : null}
            {assignError ? (
              <p className="mt-2 text-[12px] text-rose-600">{assignError}</p>
            ) : null}
          </SidebarField>

          {log.branch ? (
            <SidebarField label="Branch">
              <CodePill>{log.branch}</CodePill>
            </SidebarField>
          ) : null}

          {recipe?.source ? (
            <SidebarField label="Source">
              <p className="text-[13.5px] font-medium text-zinc-900">
                {recipe.source}
              </p>
            </SidebarField>
          ) : null}

          {recipe?.visibility ? (
            <SidebarField label="Visibility">
              <p className="text-[13.5px] font-medium text-zinc-900">
                {recipe.visibility}
              </p>
            </SidebarField>
          ) : null}

          {outputs.length > 0 ? (
            <SidebarField label="Outputs">
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
            </SidebarField>
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
          "flex h-9 w-full items-center justify-between gap-2 border-0 border-b border-zinc-200 bg-transparent py-1.5 pr-1 text-left transition hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
          open && "border-zinc-900",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="min-w-0 truncate text-[13.5px] font-medium text-zinc-900">
          {selected ? selected.title : "Unassigned"}
        </span>
        <IconChevronDown
          className={cn(
            "size-3.5 shrink-0 text-zinc-400 transition",
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
              !selected ? "font-semibold text-zinc-950" : "text-zinc-600",
            )}
          >
            Unassigned
          </button>
          <div className="openlog-scroll max-h-56 overflow-y-auto border-t border-zinc-100">
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

function CodePill({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border border-zinc-200/80 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10.5px] text-zinc-500">
      {children}
    </code>
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
