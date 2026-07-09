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
import { getTabHref, getTaskHref, type WorkspaceWorkItem } from "./data";
import { saveTaskOverride } from "./taskOverrides";
import { updateWorkspaceTask } from "./workspaceActions";

export function TaskEditView({
  task,
  workspaceId,
}: {
  task: WorkspaceWorkItem;
  workspaceId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(task.title);
  const [body, setBody] = useState(task.body);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const trimmedTitle = title.trim();
  const canSave = trimmedTitle.length > 0;

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
    const selectedText = body.slice(selectionStart, selectionEnd);
    const { nextValue, nextSelectionStart, nextSelectionEnd } = formatSelection(
      action,
      body,
      selectedText,
      selectionStart,
      selectionEnd,
      { fallbackText: getImageFallbackText(payload) },
    );

    setBody(nextValue);

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    });
  }

  async function saveTask() {
    if (!canSave || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);

    if (workspaceId) {
      const result = await updateWorkspaceTask({
        workspaceId,
        taskId: task.id,
        title: trimmedTitle,
        description: task.description ?? null,
        content: body,
        status: task.apiStatus ?? toApiTaskStatus(task.status),
      });

      setIsSaving(false);

      if (!result.ok) {
        setError(result.message ?? "Failed to save task.");
        return;
      }

      router.push(getTaskHref(task.id));
      router.refresh();
      return;
    }

    saveTaskOverride(task.id, {
      title: trimmedTitle,
      body,
    });
    setIsSaving(false);
    router.push(getTaskHref(task.id));
    router.refresh();
  }

  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href={getTabHref("workspace", true)}
          className="font-semibold text-zinc-700 transition hover:text-zinc-950"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <span>Tasks</span>
        <span className="text-zinc-300">/</span>
        <Link
          href={getTaskHref(task.id)}
          className="truncate font-mono text-[12px] text-zinc-700 transition hover:text-zinc-950"
        >
          {task.id}
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">Edit</span>
      </nav>

      <article className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
        <header className="border-b border-zinc-100 px-6 pb-5 pt-[22px]">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            Edit task
          </p>
          <label className="mt-3 block">
            <span className="sr-only">Task title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Task title"
              className="w-full border-0 bg-transparent p-0 font-[family-name:var(--font-georgia,Georgia,serif)] text-2xl font-bold tracking-[-0.01em] text-zinc-950 outline-none placeholder:text-zinc-300"
            />
          </label>
        </header>

        <div className="border-b border-zinc-100 bg-zinc-50/80 px-4">
          <div className="flex items-center gap-4">
            <TabButton active={mode === "write"} onClick={() => setMode("write")}>
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
            <span className="sr-only">Task document</span>
            <textarea
              ref={editorRef}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={`## Context\nWhy this task exists\n\n## Goal\nWhat done looks like\n\n## Scope\n- In\n- Out`}
              className="min-h-[420px] w-full resize-y border-0 bg-white px-6 py-5 font-mono text-[13.5px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400"
            />
          </label>
        ) : (
          <div className="min-h-[420px] px-6 py-5 text-[15px] leading-7 text-zinc-800">
            <MarkdownContent
              markdown={body}
              variant="compact"
              emptyFallback={
                <p className="text-zinc-400">Nothing to preview yet.</p>
              }
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/80 px-6 py-4">
          <span className="text-[12px] text-zinc-500">
            {error ?? "Markdown supported · title and body save together"}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={getTaskHref(task.id)}
              className="inline-flex h-9 items-center rounded-xl px-4 text-[13.5px] font-semibold text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={saveTask}
              disabled={!canSave || isSaving}
              className={cn(
                "inline-flex h-9 items-center rounded-xl px-4 text-[13.5px] font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                canSave && !isSaving
                  ? "bg-zinc-950 hover:bg-zinc-800"
                  : "cursor-not-allowed bg-zinc-400",
              )}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

function toApiTaskStatus(status: WorkspaceWorkItem["status"]) {
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
        "relative h-12 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
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
