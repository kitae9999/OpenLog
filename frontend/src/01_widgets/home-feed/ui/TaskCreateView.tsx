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
import { getTabHref, getTaskHref, getTasksHref } from "./data";
import { createTaskOverride } from "./taskOverrides";
import { createWorkspaceTask } from "./workspaceActions";
import type { WorkspaceUiData } from "./workspaceTypes";

type TaskStatus = "TODO" | "DOING" | "DONE";

const statusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: "TODO", label: "Todo" },
  { value: "DOING", label: "Doing" },
  { value: "DONE", label: "Done" },
];

export function TaskCreateView({
  isLoggedIn,
  workspaceData,
}: {
  isLoggedIn: boolean;
  workspaceData?: WorkspaceUiData | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
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

    if (workspaceData) {
      const result = await createWorkspaceTask({
        workspaceId: workspaceData.workspaceId,
        title: trimmedTitle,
        content: body,
        status,
      });

      setIsSaving(false);

      if (!result.ok || !result.href) {
        setError(result.message ?? "Failed to create task.");
        return;
      }

      router.push(result.href);
      router.refresh();
      return;
    }

    const task = createTaskOverride({
      title: trimmedTitle,
      body,
      status:
        status === "DOING" ? "doing" : status === "DONE" ? "done" : "todo",
    });

    setIsSaving(false);
    router.push(getTaskHref(task.id));
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-[920px] pb-4">
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
        <span className="font-semibold text-zinc-950">New</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-12 lg:items-start">
        <div className="min-w-0">
          <header className="pb-8">
            <p className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
              New task
            </p>
            <label className="mt-3 block">
              <span className="sr-only">Task title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Task title"
                className="w-full border-0 border-b border-zinc-200 bg-transparent px-0 py-1 text-[22px] font-semibold tracking-tight text-zinc-950 outline-none transition placeholder:text-zinc-300 focus:border-zinc-900"
              />
            </label>
          </header>

          <section>
            <div
              role="tablist"
              aria-label="Task document editor"
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
                <span className="sr-only">Task document</span>
                <textarea
                  ref={editorRef}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder={`## Context\nWhy this task exists\n\n## Goal\nWhat done looks like\n\n## Scope\n- In\n- Out`}
                  className="openlog-scroll min-h-[420px] w-full resize-none overflow-y-auto border-0 bg-transparent py-2 font-mono text-[13.5px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400"
                />
              </label>
            ) : (
              <div className="mt-3 min-h-[420px] py-2 text-[15px] leading-7 text-zinc-800">
                <MarkdownContent
                  markdown={body}
                  variant="compact"
                  emptyFallback={
                    <p className="text-zinc-400">Nothing to preview yet.</p>
                  }
                />
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
              {error ? (
                <p className="text-[12.5px] font-medium text-rose-600">
                  {error}
                </p>
              ) : (
                <span className="text-[12.5px] text-zinc-500">
                  Title is required
                </span>
              )}
              <div className="flex items-center gap-3">
                <Link
                  href={getTasksHref()}
                  className="cursor-pointer text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={saveTask}
                  disabled={!canSave || isSaving}
                  className={cn(
                    "cursor-pointer text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                    canSave && !isSaving
                      ? "text-zinc-950 hover:text-zinc-700"
                      : "cursor-not-allowed text-zinc-400",
                  )}
                >
                  {isSaving ? "Creating..." : "Create task"}
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6 border-t border-zinc-200/80 pt-6 lg:sticky lg:top-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          <FieldSelect
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as TaskStatus)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FieldSelect>
        </aside>
      </div>
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
        {label}
      </span>
      <div className="relative mt-1.5">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full cursor-pointer appearance-none border-0 border-b border-zinc-200 bg-transparent py-1.5 pr-7 text-[13.5px] font-medium text-zinc-900 outline-none transition hover:border-zinc-300 focus:border-zinc-900"
        >
          {children}
        </select>
        <IconChevronDown className="pointer-events-none absolute right-0 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
      </div>
    </label>
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
        "relative h-9 cursor-pointer px-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
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
