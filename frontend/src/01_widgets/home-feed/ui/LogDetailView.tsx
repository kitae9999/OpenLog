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
  getTaskById,
  getTaskHref,
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
  const initialBody = getLogBody(log);
  const [localBody, setLocalBody] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftBody, setDraftBody] = useState(initialBody);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
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
    log.status === "OPEN"
      ? "Open"
      : log.status === "CLOSED"
        ? "Closed"
        : null;

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

    if (workspaceData) {
      const result = await updateWorkspaceLog({
        workspaceId: workspaceData.workspaceId,
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
          <StatusBadge
            tone={
              statusLabel
                ? log.status === "OPEN"
                  ? "open"
                  : "closed"
                : "type"
            }
            label={statusLabel ?? typeLabel}
          />
          {statusLabel ? (
            <>
              <MetaSep />
              <span>{typeLabel}</span>
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
                    <span className="sr-only">Log content</span>
                    <textarea
                      ref={editorRef}
                      value={draftBody}
                      onChange={(event) => setDraftBody(event.target.value)}
                      placeholder={`## Problem\nWhat went wrong\n\n## Cause\nWhy it happened\n\n## Fix\nWhat changed\n\n## Verification\nHow you confirmed`}
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
                      onClick={saveContent}
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
                    Content
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
                        No log content yet.
                      </p>
                      <p className="mt-1.5 text-[13px] leading-5 text-zinc-500">
                        Write the recipe in markdown — problem, cause, fix,
                        verification.
                      </p>
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={startEditing}
                          className="inline-flex h-8 items-center justify-center rounded-[10px] border border-zinc-300 bg-white px-3 text-[12.5px] font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                        >
                          Write log content
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
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
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-zinc-950 px-4 text-[13px] font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              Send to memory
            </button>
          </div>
        </div>

        <aside className="space-y-5 px-1 lg:sticky lg:top-6 lg:px-0">
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
                className="mt-2 inline-flex text-[12px] font-semibold text-zinc-500 transition hover:text-zinc-950"
              >
                Open task →
              </Link>
            ) : null}
            {assignError ? (
              <p className="mt-2 text-[12px] text-red-600">{assignError}</p>
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
                      className="text-[13px] font-medium leading-5 text-zinc-800 transition hover:text-zinc-950 hover:underline"
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
  tone,
  label,
}: {
  tone: "open" | "closed" | "type";
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold tracking-wide text-white shadow-sm",
        tone === "open" && "bg-emerald-600",
        tone === "closed" && "bg-zinc-600",
        tone === "type" && "bg-zinc-500",
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
